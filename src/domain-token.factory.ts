export const DOMAIN_TOKEN_PREFIX = 'DOMAIN';

export function createDomainToken(
  context: string,
  type: string,
  name: string,
): string {
  return `${DOMAIN_TOKEN_PREFIX}:${context}:${type}:${name}`;
}
