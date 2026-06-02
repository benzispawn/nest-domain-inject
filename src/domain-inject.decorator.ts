import 'reflect-metadata';

import { DomainRegistry, DOMAIN_INJECT_CONTEXT_METADATA } from './domain-registry';

export function DomainInject(context: string): ClassDecorator {
  return (target: object) => {
    const classTarget = target as abstract new (...args: any[]) => any;
    Reflect.defineMetadata(DOMAIN_INJECT_CONTEXT_METADATA, context, classTarget);
    DomainRegistry.registerTarget(classTarget, context);
  };
}
