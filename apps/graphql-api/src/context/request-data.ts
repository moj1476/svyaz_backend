import type { Clients, DataMap, ServiceName } from '#contracts';
import DataLoader from 'dataloader';
import type { QueryContext } from './query-context';
export class RequestData {
  constructor(private readonly clients: Clients) {}
  data<K extends ServiceName>(service: K, context: QueryContext): Promise<DataMap[K]> {
    if (!context.cache.has(service))
      context.cache.set(service, this.clients[service].snapshot(context));

    return context.cache.get(service) as Promise<DataMap[K]>;
  }
  prepareContext(context: QueryContext) {
    context.users = new DataLoader(async (ids) => {
      const data = await this.data('identity', context);
      const users = new Map(data.users.map((user) => [user.id, user]));

      return ids.map((id) => users.get(id) ?? null);
    });
  }
  async user(context: QueryContext, id: string) {
    if (!context.users) this.prepareContext(context);

    return context.users!.load(id);
  }
}
