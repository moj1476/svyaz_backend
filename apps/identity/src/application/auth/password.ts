import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const saltBytes = 16;
const keyBytes = 32;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      keyBytes,
      { N: 65536, r: 8, p: 1, maxmem: 80 * 1024 ** 2 },
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(saltBytes);
  const key = await derive(password, salt);
  return 'scrypt-v1:' + salt.toString('hex') + ':' + key.toString('hex');
}

export async function verifyPassword(
  password: string,
  stored: string | null,
): Promise<boolean> {
  const parts = /^scrypt-v1:([0-9a-f]{32}):([0-9a-f]{64})$/.exec(stored ?? '');
  const salt = parts ? Buffer.from(parts[1]!, 'hex') : Buffer.alloc(saltBytes);
  const expected = parts ? Buffer.from(parts[2]!, 'hex') : Buffer.alloc(keyBytes);
  const matches = timingSafeEqual(await derive(password, salt), expected);
  return parts !== null && matches;
}
