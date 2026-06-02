import { DynamicModule, Module, Provider } from '@nestjs/common';

import {
  DomainModuleRegisterOptions,
  DomainProviderToken,
  parseDomainModuleOptions,
} from './domain-config.parser';
import { DomainRegistry } from './domain-registry';
import { createDomainToken } from './domain-token.factory';

@Module({})
export class DomainModule {
  static register(options: DomainModuleRegisterOptions): DynamicModule {
    const parsedOptions = parseDomainModuleOptions(options);
    DomainRegistry.registerContexts(parsedOptions.configs);

    const providerEntries = Object.values(parsedOptions.providers) as Provider[];
    const aliasProviders = parsedOptions.configs.flatMap((config) =>
      config.inject.map((injectItem) => {
        const token = createDomainToken(config.context, injectItem.type, injectItem.name);
        const providerToken = parsedOptions.providers[
          injectItem.providerKey
        ] as DomainProviderToken;

        return {
          provide: token,
          useExisting: providerToken,
        };
      }),
    );

    return {
      module: DomainModule,
      providers: [...providerEntries, ...aliasProviders],
      exports: aliasProviders.map((provider) => provider.provide),
    };
  }
}
