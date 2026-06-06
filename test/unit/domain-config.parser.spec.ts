import { parseDomainModuleOptions } from '../../src/domain-config.parser';

class UserService {}
class UserRepository {}

const USER_REPOSITORY = Symbol('USER_REPOSITORY');

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
      providers: [UserService, UserRepository],
      providerTokens: {
        'user.service': UserService,
        'user.repository': UserRepository,
      },
    });

    expect(parsed.configs).toHaveLength(1);
    expect(parsed.providers).toEqual([UserService, UserRepository]);
    expect(parsed.providerTokens['user.service']).toBe(UserService);
    expect(parsed.providerTokens['user.repository']).toBe(UserRepository);
  });

  it('parses explicit providers separately from provider tokens', () => {
    const repositoryProvider = {
      provide: USER_REPOSITORY,
      useValue: new UserRepository(),
    };

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
      providers: [UserService, repositoryProvider],
      providerTokens: {
        'user.service': UserService,
        'user.repository': USER_REPOSITORY,
      },
    });

    expect(parsed.providers).toEqual([UserService, repositoryProvider]);
    expect(parsed.providerTokens['user.service']).toBe(UserService);
    expect(parsed.providerTokens['user.repository']).toBe(USER_REPOSITORY);
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
        providers: [UserService, UserRepository],
        providerTokens: {
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
        providers: [UserService, UserRepository],
        providerTokens: {
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
        providers: [],
        providerTokens: {},
      }),
    ).toThrow('providerKey "user.service" is not registered in providerTokens');
  });

  it('fails when providerTokens is missing', () => {
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
        providers: [UserService],
      } as never),
    ).toThrow('providerTokens is required');
  });
});
