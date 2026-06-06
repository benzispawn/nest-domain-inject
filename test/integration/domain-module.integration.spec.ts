import {
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
} from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { DomainBase } from '../../src/domain-base';
import { DomainInject } from '../../src/domain-inject.decorator';
import { DomainModule } from '../../src/domain-module';

@Injectable()
class UserRepository {
  async getById(id: string): Promise<{ id: string; name: string }> {
    return { id, name: 'Ada Lovelace' };
  }
}

@Injectable()
class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUser(id: string): Promise<{ id: string; name: string }> {
    return this.userRepository.getById(id);
  }
}

type UsersDomain = {
  userService: UserService;
  userRepository: UserRepository;
};

interface UserRepositoryPort {
  getById(id: string): Promise<{ id: string; name: string }>;
}

const USER_REPOSITORY = Symbol('USER_REPOSITORY');

@Injectable()
class ConfigurableUserRepository implements UserRepositoryPort {
  constructor(private readonly defaultName: string) {}

  async getById(id: string): Promise<{ id: string; name: string }> {
    return { id, name: this.defaultName };
  }
}

@Injectable()
class ConfigurableUserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async getUser(id: string): Promise<{ id: string; name: string }> {
    return this.userRepository.getById(id);
  }
}

type ConfigurableUsersDomain = {
  userService: ConfigurableUserService;
  userRepository: UserRepositoryPort;
};

const usersDomainConfig = {
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
class UsersController extends DomainBase<UsersDomain> {
  @Get(':id')
  async getUser(id: string): Promise<{ id: string; name: string }> {
    return this.$.userService.getUser(id);
  }
}

@Controller('configured-users')
@DomainInject('configured-users')
class ConfigurableUsersController extends DomainBase<ConfigurableUsersDomain> {
  @Get(':id')
  async getUser(id: string): Promise<{ id: string; name: string }> {
    return this.$.userService.getUser(id);
  }
}

const configurableUsersDomainConfig = {
  context: 'configured-users',
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

const USER_REPOSITORY_NAME = Symbol('USER_REPOSITORY_NAME');

@Module({})
class UsersDataModule {
  static register(options: { defaultName: string }): DynamicModule {
    return {
      module: UsersDataModule,
      providers: [
        {
          provide: USER_REPOSITORY_NAME,
          useValue: options.defaultName,
        },
        {
          provide: USER_REPOSITORY,
          useFactory: (defaultName: string) =>
            new ConfigurableUserRepository(defaultName),
          inject: [USER_REPOSITORY_NAME],
        },
      ],
      exports: [USER_REPOSITORY],
    };
  }
}

describe('DomainModule integration', () => {
  it('injects domain dependencies into controller properties', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        DomainModule.register({
          configs: [usersDomainConfig],
          providers: [UserService, UserRepository],
          providerTokens: {
            'user.service': UserService,
            'user.repository': UserRepository,
          },
        }),
      ],
      controllers: [UsersController],
    }).compile();

    const controller = moduleRef.get(UsersController);

    await expect(controller.getUser('1')).resolves.toEqual({
      id: '1',
      name: 'Ada Lovelace',
    });
  });

  it('aliases imported dynamic-module providers by token', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        DomainModule.register({
          configs: [configurableUsersDomainConfig],
          imports: [UsersDataModule.register({ defaultName: 'Grace Hopper' })],
          providers: [ConfigurableUserService],
          providerTokens: {
            'user.service': ConfigurableUserService,
            'user.repository': USER_REPOSITORY,
          },
        }),
      ],
      controllers: [ConfigurableUsersController],
    }).compile();

    const controller = moduleRef.get(ConfigurableUsersController);

    await expect(controller.getUser('2')).resolves.toEqual({
      id: '2',
      name: 'Grace Hopper',
    });
  });

  it('aliases provider objects registered by DomainModule', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        DomainModule.register({
          configs: [configurableUsersDomainConfig],
          providers: [
            ConfigurableUserService,
            {
              provide: USER_REPOSITORY,
              useFactory: () => new ConfigurableUserRepository('Katherine Johnson'),
            },
          ],
          providerTokens: {
            'user.service': ConfigurableUserService,
            'user.repository': USER_REPOSITORY,
          },
        }),
      ],
      controllers: [ConfigurableUsersController],
    }).compile();

    const controller = moduleRef.get(ConfigurableUsersController);

    await expect(controller.getUser('3')).resolves.toEqual({
      id: '3',
      name: 'Katherine Johnson',
    });
  });
});
