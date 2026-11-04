import { createClient } from 'redis';
import { required } from '../../../../../packages/config/src';
import type {
  Presence,
  PresenceData,
  ReadRepository,
} from '../../../../../packages/contracts/src';
import type { ReadScope } from '../../../../../packages/contracts/src/read-scope';

export class Repository implements ReadRepository<PresenceData> {
  private client = createClient({
    url: required('REDIS_URL'),
    socket: { reconnectStrategy: false, connectTimeout: 5000 },
  });

  constructor() {
    this.client.on('error', () => {});
  }

  async load(scope?: ReadScope): Promise<PresenceData> {
    if (!this.client.isOpen) await this.client.connect();

    const presence: Presence[] = [];

    for (const workspaceId of scope?.workspaceIds ?? []) {
      for await (const keys of this.client.scanIterator({
        MATCH: `presence:${workspaceId}:*`,
        COUNT: 100,
      })) {
        if (!keys.length) continue;

        const values = await this.client.mGet(keys);

        for (const value of values)
          if (value) presence.push(JSON.parse(value) as Presence);
      }
    }

    return { presence };
  }

  async close() {
    if (this.client.isOpen) await this.client.quit();
  }
}
