import type { Clients, DataMap, ServiceName } from '../../../../packages/contracts/src';
import { DomainError } from '../../../../packages/contracts/src/errors';
import { BatchLoader } from '../../../../packages/runtime/src/batch-loader';
import type { QueryContext } from './query-context';
export class RequestData {
  constructor(private readonly clients: Clients) {}
  data<K extends ServiceName>(service: K, context: QueryContext): Promise<DataMap[K]> {
    if (context.failed === service)
      throw new DomainError('UNAVAILABLE', 'Учебный отказ источника');

    if (!context.cache.has(service))
      context.cache.set(service, this.clients[service].snapshot(context));

    return context.cache.get(service) as Promise<DataMap[K]>;
  }
  prepareContext(context: QueryContext) {
    context.users = new BatchLoader(async (ids) => {
      const data = await this.data('identity', context);
      const users = new Map(data.users.map((user) => [user.id, user]));

      return new Map(ids.map((id) => [id, users.get(id) ?? null]));
    });
  }
  async user(context: QueryContext, id: string) {
    if (!context.users) this.prepareContext(context);

    return context.users!.load(id);
  }
}
