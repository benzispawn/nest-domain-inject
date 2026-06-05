export { DomainBase } from './domain-base';
export {
  domainContextConfigSchema,
  domainInjectItemSchema,
  domainModuleRegisterSchema,
} from './domain-config.schema';
export type {
  DomainContextConfig,
  DomainInjectItemConfig,
  DomainModuleRegisterInput,
} from './domain-config.schema';
export type {
  DomainModuleBaseRegisterOptions,
  DomainModuleLegacyRegisterOptions,
  DomainModuleRegisterOptions,
  DomainModuleTokenRegisterOptions,
  DomainProviderToken,
  LegacyDomainProviderMap,
  ParsedDomainModuleRegisterOptions,
} from './domain-config.parser';
export {
  parseDomainModuleOptions,
} from './domain-config.parser';
export { DomainInject } from './domain-inject.decorator';
export { DomainModule } from './domain-module';
export { createDomainToken, DOMAIN_TOKEN_PREFIX } from './domain-token.factory';
