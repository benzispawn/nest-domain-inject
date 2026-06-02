import { Controller, Get, Injectable } from '@nestjs/common';
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

describe('DomainModule integration', () => {
  it('injects domain dependencies into controller properties', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        DomainModule.register({
          configs: [usersDomainConfig],
          providers: {
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
});
