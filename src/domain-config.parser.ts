import type {
  InjectionToken,
  ModuleMetadata,
  Provider,
} from '@nestjs/common';

import { domainModuleRegisterSchema } from './domain-config.schema';
import type { DomainContextConfig } from './domain-config.schema';

export type DomainProviderToken = InjectionToken;

export interface DomainModuleRegisterOptions {
  configs: readonly DomainContextConfig[];
  imports?: ModuleMetadata['imports'];
  providers?: readonly Provider[];
  providerTokens: Record<string, DomainProviderToken>;
}

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
  const parsed = domainModuleRegisterSchema.safeParse(input);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    });

    throw formatValidationIssues(issues);
  }

  const providersInput = parsed.data.providers;
  const providerTokens = parsed.data.providerTokens as Record<
    string,
    DomainProviderToken
  >;
  const providers = (providersInput ?? []) as Provider[];
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
