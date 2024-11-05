import { AccessToken } from './types';

export class AccessTokenParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccessTokenParseError';
  }
}

export function parseAccessToken(authHeader: string | null): AccessToken {
  if (!authHeader) {
    throw new AccessTokenParseError('Missing access token');
  }

  const [type, token] = authHeader.split(' ');

  if (!type) {
    throw new AccessTokenParseError('Missing access token type');
  }

  if (type.toLowerCase() !== 'bearer') {
    throw new AccessTokenParseError('Invalid access token type');
  }

  return AccessToken.parse(token);
}
