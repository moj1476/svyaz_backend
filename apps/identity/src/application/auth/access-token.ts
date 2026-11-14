import { createHmac, timingSafeEqual } from 'node:crypto';
import { DomainError, uuid } from '#contracts/errors';

const issuer = 'svyaz-identity';
const audience = 'svyaz-graphql';
const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
  'base64url',
);
const tokenPattern = /^[\w-]+\.[\w-]+\.[\w-]{43}$/;

interface Claims {
  iss: typeof issuer;
  aud: typeof audience;
  sub: string;
  jti: string;
  iat: number;
  exp: number;
}

export class AccessToken {
  private readonly key: Buffer;

  constructor(secret: string) {
    if (!/^[0-9a-f]{64}$/i.test(secret))
      throw new Error('JWT_SECRET должен содержать 32 случайных байта в hex');
    this.key = Buffer.from(secret, 'hex');
  }

  issue(userId: string, sessionId: string, issuedAt: number, expiresAt: number): string {
    const claims: Claims = {
      iss: issuer,
      aud: audience,
      sub: userId,
      jti: sessionId,
      iat: issuedAt,
      exp: expiresAt,
    };
    const body = header + '.' + Buffer.from(JSON.stringify(claims)).toString('base64url');
    return body + '.' + this.sign(body).toString('base64url');
  }

  verify(token: string, now: number) {
    if (token.length <= 1024 && tokenPattern.test(token)) {
      const [encodedHeader, payload, signature] = token.split('.') as [
        string,
        string,
        string,
      ];
      const decodedSignature = Buffer.from(signature, 'base64url');
      if (
        encodedHeader === header &&
        decodedSignature.toString('base64url') === signature &&
        timingSafeEqual(this.sign(encodedHeader + '.' + payload), decodedSignature)
      ) {
        try {
          const claims = JSON.parse(
            Buffer.from(payload, 'base64url').toString('utf8'),
          ) as Claims;
          if (
            claims.iss === issuer &&
            claims.aud === audience &&
            Number.isSafeInteger(claims.iat) &&
            claims.iat <= now &&
            Number.isSafeInteger(claims.exp) &&
            claims.exp > now &&
            typeof claims.sub === 'string' &&
            typeof claims.jti === 'string'
          )
            return { userId: uuid(claims.sub), sessionId: uuid(claims.jti) };
        } catch {
          // Invalid claims use the same error as invalid signatures.
        }
      }
    }
    throw new DomainError('UNAUTHENTICATED', 'Требуется вход в аккаунт');
  }

  private sign(data: string) {
    return createHmac('sha256', this.key).update(data).digest();
  }
}
