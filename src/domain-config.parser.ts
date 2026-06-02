import type { Type } from '@nestjs/common';

import {
  DomainContextConfig,
  domainModuleRegisterSchema,
} from './domain-config.schema';

export type DomainProviderToken = Type<unknown>;

export interface DomainModuleRegisterOptions {
  configs: readonly DomainContextConfig[];
  providers: Record<string, DomainProviderToken>;
}

export interface ParsedDomainModuleRegisterOptions {
  readonly configs: readonly DomainContextConfig[];
  readonly providers: Readonly<Record<string, DomainProviderToken>>;
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

  return {
    configs: parsed.data.configs,
    providers: parsed.data
      .providers as Readonly<Record<string, DomainProviderToken>>,
  };
}
