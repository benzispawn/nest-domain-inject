import { Inject } from '@nestjs/common';

import { DomainContextConfig } from './domain-config.schema';
import { createDomainToken } from './domain-token.factory';

export const DOMAIN_INJECT_CONTEXT_METADATA = 'domain:inject:context';
const APPLIED_CONTEXTS_SYMBOL = Symbol('domain:applied-contexts');

type DomainTarget = abstract new (...args: any[]) => any;

export class DomainRegistry {
  private static readonly contexts = new Map<string, DomainContextConfig>();
  // Class decorators can run before DomainModule.register(), so unresolved targets are queued here.
  private static readonly pendingTargets = new Map<DomainTarget, Set<string>>();

  static clear(): void {
    DomainRegistry.contexts.clear();
    DomainRegistry.pendingTargets.clear();
  }

  static registerContexts(configs: readonly DomainContextConfig[]): void {
    configs.forEach((config) => {
      DomainRegistry.contexts.set(config.context, config);
      DomainRegistry.applyPendingTargetsForContext(config.context);
    });
  }

  static getContext(context: string): DomainContextConfig | undefined {
    return DomainRegistry.contexts.get(context);
  }

  static registerTarget(target: DomainTarget, context: string): void {
    const applied = DomainRegistry.applyContextIfAvailable(target, context);
    if (applied) {
      return;
    }

    const contexts = DomainRegistry.pendingTargets.get(target) ?? new Set<string>();
    contexts.add(context);
    DomainRegistry.pendingTargets.set(target, contexts);
  }

  private static applyPendingTargetsForContext(context: string): void {
    for (const [target, contexts] of DomainRegistry.pendingTargets.entries()) {
      if (!contexts.has(context)) {
        continue;
      }

      DomainRegistry.applyContextIfAvailable(target, context);
      contexts.delete(context);

      if (contexts.size === 0) {
        DomainRegistry.pendingTargets.delete(target);
      }
    }
  }

  private static applyContextIfAvailable(
    target: DomainTarget,
    context: string,
  ): boolean {
    const config = DomainRegistry.contexts.get(context);
    if (!config) {
      return false;
    }

    DomainRegistry.applyContext(target, config);
    return true;
  }

  private static applyContext(target: DomainTarget, config: DomainContextConfig): void {
    const appliedContexts = DomainRegistry.getAppliedContexts(target);
    if (appliedContexts.has(config.context)) {
      return;
    }

    config.inject.forEach((injectItem) => {
      const token = createDomainToken(config.context, injectItem.type, injectItem.name);
      // Reuses Nest property-injection metadata so runtime behavior stays aligned with native @Inject.
      Inject(token)(target.prototype, injectItem.property);
    });

    appliedContexts.add(config.context);
  }

  private static getAppliedContexts(target: DomainTarget): Set<string> {
    const maybeApplied = (target as unknown as Record<PropertyKey, unknown>)[
      APPLIED_CONTEXTS_SYMBOL
    ];

    if (maybeApplied instanceof Set) {
      return maybeApplied as Set<string>;
    }

    const appliedContexts = new Set<string>();
    Object.defineProperty(target, APPLIED_CONTEXTS_SYMBOL, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: appliedContexts,
    });

    return appliedContexts;
  }
}
