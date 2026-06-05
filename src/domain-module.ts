import { Module } from '@nestjs/common';
import type { DynamicModule, Provider } from '@nestjs/common';

import { parseDomainModuleOptions } from './domain-config.parser';
import type {
  DomainModuleLegacyRegisterOptions,
  DomainModuleRegisterOptions,
  DomainModuleTokenRegisterOptions,
} from './domain-config.parser';
import { DomainRegistry } from './domain-registry';
import { createDomainToken } from './domain-token.factory';

@Module({})
export class DomainModule {
  static register(options: DomainModuleTokenRegisterOptions): DynamicModule;
  static register(options: DomainModuleLegacyRegisterOptions): DynamicModule;
  static register(options: DomainModuleRegisterOptions): DynamicModule {
    const parsedOptions = parseDomainModuleOptions(options);
    DomainRegistry.registerContexts(parsedOptions.configs);

    const aliasProviders = parsedOptions.configs.flatMap((config) =>
      config.inject.map((injectItem) => {
        const token = createDomainToken(config.context, injectItem.type, injectItem.name);
        const providerToken = parsedOptions.providerTokens[injectItem.providerKey];

        return {
          provide: token,
          useExisting: providerToken,
        };
      }),
    );

    return {
      module: DomainModule,
      imports: parsedOptions.imports,
      providers: [...parsedOptions.providers, ...aliasProviders] as Provider[],
      exports: aliasProviders.map((provider) => provider.provide),
    };
  }
}
