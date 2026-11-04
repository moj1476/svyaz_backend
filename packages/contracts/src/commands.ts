import type { OutboxWriter, DomainEvent } from './events';
import type { ReadRepository, RequestContext } from './index';

export { mutationOwners } from './command-map';

export { queryOwners } from './queries';

export interface TransactionStore<T> extends ReadRepository<T> {
  pendingEvents?(limit?: number): Promise<DomainEvent[]>;
  aggregate?(workspaceId: string): Promise<import('./statistics').StoredStatistics<T>>;
  withOperation?<R>(
    context: RequestContext,
    operation: string,
    input: Record<string, unknown>,
    work: () => Promise<R>,
  ): Promise<R>;
  transact<R>(
    context: RequestContext,
    operation: string,
    input: Record<string, unknown>,
    work: (draft: T, outbox: OutboxWriter) => Promise<R>,
  ): Promise<R>;
}
