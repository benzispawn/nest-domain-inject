import { PROPERTY_DEPS_METADATA } from '@nestjs/common/constants';

import { DomainInject } from '../../src/domain-inject.decorator';
import { DomainRegistry } from '../../src/domain-registry';
import { createDomainToken } from '../../src/domain-token.factory';

const usersConfig = {
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

describe('DomainInject decorator', () => {
  beforeEach(() => {
    DomainRegistry.clear();
  });

  it('defers injection when context is not registered yet and applies later', () => {
    @DomainInject('users')
    class DeferredTarget {}

    let metadata = Reflect.getMetadata(PROPERTY_DEPS_METADATA, DeferredTarget);
    expect(metadata).toBeUndefined();

    DomainRegistry.registerContexts([usersConfig]);

    metadata = Reflect.getMetadata(PROPERTY_DEPS_METADATA, DeferredTarget);
    expect(metadata).toEqual(
      expect.arrayContaining([
        {
          key: 'userService',
          type: createDomainToken('users', 'service', 'user'),
        },
        {
          key: 'userRepository',
          type: createDomainToken('users', 'repository', 'user'),
        },
      ]),
    );
  });

  it('applies injection immediately when context is already registered', () => {
    DomainRegistry.registerContexts([usersConfig]);

    @DomainInject('users')
    class ImmediateTarget {}

    const metadata = Reflect.getMetadata(PROPERTY_DEPS_METADATA, ImmediateTarget);
    expect(metadata).toEqual(
      expect.arrayContaining([
        {
          key: 'userService',
          type: createDomainToken('users', 'service', 'user'),
        },
        {
          key: 'userRepository',
          type: createDomainToken('users', 'repository', 'user'),
        },
      ]),
    );
  });
});
