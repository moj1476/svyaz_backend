import { createHash } from 'node:crypto';
import { createClient } from 'redis';
import { required } from '#config';
import { DomainError } from '#contracts/errors';

export class AuthSessions {
  private readonly client = createClient({
    url: required('REDIS_URL'),
    disableOfflineQueue: true,
    socket: { reconnectStrategy: false, connectTimeout: 5000 },
  });

  private connecting?: Promise<unknown>;

  constructor() {
    this.client.on('error', () => {});
  }

  async create(id: string, userId: string, expiresAt: number) {
    await this.run(() =>
      this.client.set('auth:session:' + id, userId, {
        expiration: { type: 'EXAT', value: expiresAt },
      }),
    );
  }

  async userId(id: string) {
    return this.run(() => this.client.get('auth:session:' + id));
  }

  async remove(id: string) {
    await this.run(() => this.client.del('auth:session:' + id));
  }

  async limit(ip: string) {
    const key = 'auth:attempts:' + createHash('sha256').update(ip).digest('hex');
    const attempts = await this.run(() =>
      this.client.eval(
        "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], 60) end; return count",
        { keys: [key] },
      ),
    );
    if (Number(attempts) > 20)
      throw new DomainError(
        'RATE_LIMITED',
        'Слишком много попыток. Повторите через минуту',
      );
  }

  close() {
    if (this.client.isOpen) this.client.destroy();
  }

  private async run<T>(action: () => Promise<T>): Promise<T> {
    try {
      if (!this.client.isReady) {
        this.connecting ??= this.client.connect().finally(() => {
          this.connecting = undefined;
        });
        await this.connecting;
      }
      return await action();
    } catch {
      throw new DomainError('UNAVAILABLE', 'Хранилище сессий недоступно');
    }
  }
}
