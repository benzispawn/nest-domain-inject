import { createDomainToken } from '../../src/domain-token.factory';

describe('createDomainToken', () => {
  it('creates deterministic domain tokens', () => {
    expect(createDomainToken('users', 'service', 'user')).toBe(
      'DOMAIN:users:service:user',
    );
    expect(createDomainToken('users', 'repository', 'user')).toBe(
      'DOMAIN:users:repository:user',
    );
  });
});
