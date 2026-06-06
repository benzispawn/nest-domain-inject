# @rbenzi/nest-domain-inject

A reusable NestJS library that provides context-driven domain property injection using a class decorator.

## Installation

```bash
npm i @rbenzi/nest-domain-inject zod
```

Peer dependencies:

- `@nestjs/common`
- `@nestjs/core`
- `reflect-metadata`

## Basic Usage

```ts
import { Controller, Get, Param } from '@nestjs/common';
import { DomainBase, DomainInject, DomainModule } from '@rbenzi/nest-domain-inject';

export const usersDomainConfig = {
  context: 'users',
  inject: [
    {
      type: 'service',
      name: 'user',
      property: 'userService',
      providerKey: 'user.service',
    },
    {
      type: 'repository',
      name: 'user',
      property: 'userRepository',
      providerKey: 'user.repository',
    },
  ],
} as const;

@Controller('users')
@DomainInject('users')
export class UsersController extends DomainBase<UsersDomain> {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.$.userService.getUser(id);
  }
}
```

Register the module:

```ts
const USER_REPOSITORY = Symbol('USER_REPOSITORY');

DomainModule.register({
  configs: [usersDomainConfig],
  providers: [
    UserService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  providerTokens: {
    'user.service': UserService,
    'user.repository': USER_REPOSITORY,
  },
});
```

## Advanced Usage

- Use multiple contexts by adding multiple configs.
- Tokens are deterministic: `DOMAIN:{context}:{type}:{name}`.
- Each inject item aliases a domain token to a provider using `useExisting`.
- Use `imports` when a provider comes from another Nest module, including modules
  created with `register()` or `registerAsync()`.
- Use `providerTokens` to map each domain `providerKey` to the Nest injection
  token that should be aliased.

Example token values:

- `DOMAIN:users:service:user`
- `DOMAIN:users:repository:user`

## Register API

```ts
DomainModule.register({
  configs: [usersDomainConfig],
  imports: [],
  providers: [],
  providerTokens: {
    'user.service': UserService,
  },
});
```

Options:

- `configs`: required domain configs.
- `imports`: optional Nest modules imported by `DomainModule`.
- `providers`: optional Nest providers registered by `DomainModule`.
- `providerTokens`: required map from each config `providerKey` to a Nest
  injection token.

`providerTokens` accepts any Nest injection token: class tokens, strings,
symbols, functions, and abstract tokens.

Every `inject[].providerKey` in every config must exist in `providerTokens`.

### Class Providers

Use class providers when `DomainModule` owns the provider registration:

```ts
DomainModule.register({
  configs: [usersDomainConfig],
  providers: [UserService, UserRepository],
  providerTokens: {
    'user.service': UserService,
    'user.repository': UserRepository,
  },
});
```

### Custom Providers

Use standard Nest custom providers for symbol, string, value, factory, or
conditional class registration:

```ts
const USER_REPOSITORY = Symbol('USER_REPOSITORY');

DomainModule.register({
  configs: [usersDomainConfig],
  providers: [
    UserService,
    {
      provide: USER_REPOSITORY,
      useFactory: () => new UserRepository(),
    },
  ],
  providerTokens: {
    'user.service': UserService,
    'user.repository': USER_REPOSITORY,
  },
});
```

### Dynamic Module Providers

When a dependency is exported by a configured module, import that module through
`DomainModule.register()` and point `providerTokens` to the exported token:

```ts
const USER_REPOSITORY = Symbol('USER_REPOSITORY');

DomainModule.register({
  configs: [usersDomainConfig],
  imports: [
    UsersDataModule.register({
      defaultName: 'Ada Lovelace',
    }),
  ],
  providers: [UserService],
  providerTokens: {
    'user.service': UserService,
    'user.repository': USER_REPOSITORY,
  },
});
```

`UsersDataModule` must export `USER_REPOSITORY` for the alias provider to
resolve it.

### Multiple Contexts

Register multiple contexts in one `DomainModule.register()` call by passing
multiple configs and adding every referenced `providerKey` to `providerTokens`:

```ts
DomainModule.register({
  configs: [usersDomainConfig, billingDomainConfig],
  providers: [UserService, BillingService],
  providerTokens: {
    'user.service': UserService,
    'billing.service': BillingService,
  },
});
```

Context names must be unique. Property names inside each context must also be
unique.

### Imported Providers Only

If all dependencies come from imported modules, omit `providers` and only map
the exported tokens:

```ts
DomainModule.register({
  configs: [usersDomainConfig],
  imports: [UsersDataModule.register({ defaultName: 'Ada Lovelace' })],
  providerTokens: {
    'user.service': USER_SERVICE,
    'user.repository': USER_REPOSITORY,
  },
});
```

### Validation

`DomainModule.register()` validates configuration at startup and throws an
`Invalid domain module configuration` error when:

- `providerTokens` is missing.
- a config references a `providerKey` that does not exist in `providerTokens`.
- a context name is duplicated.
- an injected property is duplicated inside the same context.
- `inject[].property` is not a valid TypeScript identifier.

## Decorator Execution Tradeoff

TypeScript class decorators run before Nest application bootstrap. Because of this, `@DomainInject('users')` cannot rely on runtime Nest DI while executing.

This library uses a static registry strategy:

- `DomainInject` stores context metadata and registers the target class in `DomainRegistry`.
- If config for that context already exists, property `@Inject(token)` is applied immediately.
- If config is not registered yet, class is queued.
- `DomainModule.register()` validates config, stores contexts, and flushes queued classes.

This avoids relying on a brittle assumption that module registration always runs before decorator execution.

## TypeScript Limitation

Decorators cannot create static TypeScript types by themselves.

`@DomainInject('users')` injects runtime properties, but TypeScript still cannot infer those properties automatically from decorator metadata.

## DomainBase<T> Recommendation

Use `DomainBase<T>` to safely expose a typed `$` accessor:

```ts
export class UsersController extends DomainBase<UsersDomain> {
  async getUser(id: string) {
    return this.$.userService.getUser(id);
  }
}
```

This keeps runtime injection and static typing aligned.

## Testing

Run tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Build:

```bash
npm run build
```
