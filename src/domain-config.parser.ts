import type {
  InjectionToken,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';

import { domainModuleRegisterSchema } from './domain-config.schema';
import type { DomainContextConfig } from './domain-config.schema';

export type DomainProviderToken = InjectionToken;
export type LegacyDomainProviderMap = Record<string, Type<unknown>>;

export interface DomainModuleBaseRegisterOptions {
  configs: readonly DomainContextConfig[];
  imports?: ModuleMetadata['imports'];
}

export interface DomainModuleLegacyRegisterOptions
  extends DomainModuleBaseRegisterOptions {
  providers: LegacyDomainProviderMap;
  providerTokens?: Record<string, DomainProviderToken>;
}

export interface DomainModuleTokenRegisterOptions
  extends DomainModuleBaseRegisterOptions {
  providers?: readonly unknown[];
  providerTokens: Record<string, DomainProviderToken>;
}

export type DomainModuleRegisterOptions =
  | DomainModuleLegacyRegisterOptions
  | DomainModuleTokenRegisterOptions;

type DomainModuleParserInput = DomainModuleBaseRegisterOptions & {
  providers?: readonly unknown[] | LegacyDomainProviderMap;
  providerTokens?: Record<string, DomainProviderToken>;
};

export interface ParsedDomainModuleRegisterOptions {
  readonly configs: readonly DomainContextConfig[];
  readonly imports: NonNullable<ModuleMetadata['imports']>;
  readonly providers: readonly Provider[];
  readonly providerTokens: Readonly<Record<string, DomainProviderToken>>;
}

function formatValidationIssues(messages: string[]): Error {
  const detail = messages.map((message) => `- ${message}`).join('\n');
  return new Error(`Invalid domain module configuration:\n${detail}`);
}

export function parseDomainModuleOptions(
  input: DomainModuleRegisterOptions,
): ParsedDomainModuleRegisterOptions {
  const parsed = domainModuleRegisterSchema.safeParse(
    input as DomainModuleParserInput,
  );

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    });

    throw formatValidationIssues(issues);
  }

  const providersInput = parsed.data.providers;
  const providerTokens = {
    ...(providersInput && !Array.isArray(providersInput) ? providersInput : {}),
    ...(parsed.data.providerTokens ?? {}),
  } as Record<string, DomainProviderToken>;

  const providers = (
    Array.isArray(providersInput) ? providersInput : Object.values(providersInput ?? {})
  ) as Provider[];
  const imports = (parsed.data.imports ?? []) as NonNullable<
    ModuleMetadata['imports']
  >;

  return {
    configs: parsed.data.configs,
    imports,
    providers,
    providerTokens,
  };
}
