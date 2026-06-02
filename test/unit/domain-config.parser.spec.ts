import { parseDomainModuleOptions } from '../../src/domain-config.parser';

class UserService {}
class UserRepository {}

describe('parseDomainModuleOptions', () => {
  it('parses a valid configuration', () => {
    const parsed = parseDomainModuleOptions({
      configs: [
        {
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
        },
      ],
      providers: {
        'user.service': UserService,
        'user.repository': UserRepository,
      },
    });

    expect(parsed.configs).toHaveLength(1);
    expect(parsed.providers['user.service']).toBe(UserService);
    expect(parsed.providers['user.repository']).toBe(UserRepository);
  });

  it('fails when contexts are duplicated', () => {
    expect(() =>
      parseDomainModuleOptions({
        configs: [
          {
            context: 'users',
            inject: [
              {
                type: 'service',
                name: 'user',
                property: 'userService',
                providerKey: 'user.service',
              },
            ],
          },
          {
            context: 'users',
            inject: [
              {
                type: 'repository',
                name: 'user',
                property: 'userRepository',
                providerKey: 'user.repository',
              },
            ],
          },
        ],
        providers: {
          'user.service': UserService,
          'user.repository': UserRepository,
        },
      }),
    ).toThrow('duplicate context "users"');
  });

  it('fails when context has duplicate properties', () => {
    expect(() =>
      parseDomainModuleOptions({
        configs: [
          {
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
                property: 'userService',
                providerKey: 'user.repository',
              },
            ],
          },
        ],
        providers: {
          'user.service': UserService,
          'user.repository': UserRepository,
        },
      }),
    ).toThrow('duplicate property "userService"');
  });

  it('fails when providerKey is missing in providers', () => {
    expect(() =>
      parseDomainModuleOptions({
        configs: [
          {
            context: 'users',
            inject: [
              {
                type: 'service',
                name: 'user',
                property: 'userService',
                providerKey: 'user.service',
              },
            ],
          },
        ],
        providers: {},
      }),
    ).toThrow('providerKey "user.service" is not registered in providers');
  });
});
