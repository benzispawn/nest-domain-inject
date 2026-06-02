# nest-domain-inject

A reusable NestJS library that provides context-driven domain property injection using a class decorator.

## Installation

```bash
npm i nest-domain-inject zod
```

Peer dependencies:

- `@nestjs/common`
- `@nestjs/core`
- `reflect-metadata`

## Basic Usage

```ts
import { Controller, Get, Param } from '@nestjs/common';
import { DomainBase, DomainInject, DomainModule } from 'nest-domain-inject';

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
DomainModule.register({
  configs: [usersDomainConfig],
  providers: {
    'user.service': UserService,
    'user.repository': UserRepository,
  },
});
```

## Advanced Usage

- Use multiple contexts by adding multiple configs.
- Tokens are deterministic: `DOMAIN:{context}:{type}:{name}`.
- Each inject item aliases a domain token to a provider using `useExisting`.

Example token values:

- `DOMAIN:users:service:user`
- `DOMAIN:users:repository:user`

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
