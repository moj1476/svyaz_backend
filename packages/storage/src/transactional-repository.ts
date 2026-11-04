import { AsyncLocalStorage } from 'node:async_hooks';
import type { Prisma } from '../../../generated/identity/client';
import type { RequestContext } from '../../contracts/src';
import type { TransactionStore } from '../../contracts/src/commands';
import type { DomainEvent, OutboxWriter } from '../../contracts/src/events';
import type { ReadScope } from '../../contracts/src/read-scope';
import { DomainError } from '../../contracts/src/errors';
import { commandIdentity } from '../../contracts/src/idempotency';
import { canonical, jsonValue } from './values';

interface CommandSession {
  businessCommand: {
    findUnique(args: {
      where: { commandKey: string };
    }): Promise<{ fingerprint: string; result: Prisma.JsonValue } | null>;
    create(args: { data: Prisma.BusinessCommandUncheckedCreateInput }): Promise<unknown>;
  };
  outboxEvent: {
    create(args: { data: Prisma.OutboxEventUncheckedCreateInput }): Promise<unknown>;
    findMany(args: {
      where: { publishedAt: null };
      orderBy: { position: 'asc' };
      take: number;
    }): Promise<
      {
        id: string;
        eventType: string;
        schemaVersion: number;
        aggregateType: string;
        aggregateId: string;
        workspaceId: string | null;
        actorId: string;
        requestId: string;
        occurredAt: Date;
        payload: Prisma.JsonValue;
      }[]
    >;
  };
  $queryRaw<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: unknown[]
  ): Promise<T>;
}

export interface CommandSelection<T> {
  lock: string;
  load: () => Promise<T>;
}

export abstract class TransactionalRepository<
  T,
  C extends CommandSession,
> implements TransactionStore<T> {
  private readonly operations = new AsyncLocalStorage<{
    context: RequestContext;
    operation: string;
    input: Record<string, unknown>;
  }>();

  protected abstract transaction<R>(
    work: (client: C) => Promise<R>,
    repeatableRead?: boolean,
  ): Promise<R>;

  protected abstract read(client: C, scope: ReadScope): Promise<T>;

  protected abstract command(
    client: C,
    operation: string,
    input: Record<string, unknown>,
    context: RequestContext,
  ): Promise<CommandSelection<T>>;

  protected abstract save(client: C, before: T, after: T): Promise<void>;

  abstract close(): Promise<void>;

  withOperation<R>(
    context: RequestContext,
    operation: string,
    input: Record<string, unknown>,
    work: () => Promise<R>,
  ): Promise<R> {
    return this.operations.run({ context, operation, input }, work);
  }

  async load(scope?: ReadScope): Promise<T> {
    const request = this.operations.getStore();

    if (!request && !scope) throw new Error('Требуется явно указать область чтения');

    return this.transaction(async (client) => {
      if (request) {
        const selection = await this.command(
          client,
          request.operation,
          request.input,
          request.context,
        );

        return selection.load();
      }

      return this.read(client, scope!);
    }, true);
  }

  async transact<R>(
    context: RequestContext,
    operation: string,
    input: Record<string, unknown>,
    work: (draft: T, outbox: OutboxWriter) => Promise<R>,
  ): Promise<R> {
    try {
      return await this.transaction(async (client) => {
        const identity = commandIdentity(context, operation, input);

        if (identity) {
          await this.lock(client, 'command:' + identity.key);

          const existing = await client.businessCommand.findUnique({
            where: { commandKey: identity.key },
          });

          if (existing) {
            if (existing.fingerprint !== identity.hash)
              throw new DomainError(
                'CONFLICT',
                'Ключ повторно использован с другими параметрами',
              );

            return existing.result as R;
          }
        }

        const selection = await this.command(client, operation, input, context);

        await this.lock(client, 'aggregate:' + selection.lock);

        const before = await selection.load();
        const draft = structuredClone(before);
        const pending: DomainEvent[] = [];
        const result = await work(draft, { append: (event) => pending.push(event) });

        await this.save(client, before, draft);

        if (canonical(before) !== canonical(draft)) {
          for (const event of pending) {
            await client.outboxEvent.create({
              data: {
                id: event.id,
                eventType: event.type,
                schemaVersion: event.schemaVersion,
                aggregateType: event.aggregateType,
                aggregateId: event.aggregateId,
                workspaceId: event.workspaceId,
                actorId: event.actorId,
                requestId: event.requestId,
                occurredAt: new Date(event.occurredAt),
                payload: jsonValue(event.payload),
              },
            });
          }
        }

        if (identity)
          await client.businessCommand.create({
            data: {
              commandKey: identity.key,
              fingerprint: identity.hash,
              result: jsonValue(result),
            },
          });

        return result;
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new DomainError('CONFLICT', 'Нарушена уникальность данных');

      throw error;
    }
  }

  private async lock(client: C, key: string): Promise<void> {
    await client.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`;
  }

  async pendingEvents(limit = 100): Promise<DomainEvent[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000)
      throw new DomainError('VALIDATION', 'limit от 1 до 1000');

    return this.transaction(async (client) => {
      const rows = await client.outboxEvent.findMany({
        where: { publishedAt: null },
        orderBy: { position: 'asc' },
        take: limit,
      });

      return rows.map(
        (row) =>
          ({
            id: row.id,
            type: row.eventType,
            schemaVersion: row.schemaVersion,
            aggregateType: row.aggregateType,
            aggregateId: row.aggregateId,
            workspaceId: row.workspaceId,
            actorId: row.actorId,
            requestId: row.requestId,
            occurredAt: row.occurredAt.toISOString(),
            payload: row.payload,
          }) as DomainEvent,
      );
    });
  }
}
