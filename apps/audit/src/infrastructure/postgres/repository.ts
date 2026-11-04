import type { AuditData, AuditEvent } from '../../../../../packages/contracts/src';
import type { QueryInput } from '../../../../../packages/contracts/src/queries';
import { addFilter, selectPage } from '../../../../../packages/storage/src/page';
import type { Prisma } from '../../../../../generated/audit/client';
import type { ReadScope } from '../../../../../packages/contracts/src/read-scope';
import { databaseFor, sqlExecutor } from '../../../../../packages/storage/src/prisma';
import { fromAuditEvent } from './mapping';

interface StateSelection {
  events?: Prisma.AuditEventWhereInput;
}

export class Repository {
  readonly db = databaseFor('audit');
  private readonly sql = sqlExecutor(this.db);

  protected transaction<R>(
    work: (client: Prisma.TransactionClient) => Promise<R>,
    repeatableRead = false,
  ): Promise<R> {
    return this.db.$transaction(work, {
      isolationLevel: repeatableRead ? 'RepeatableRead' : 'ReadCommitted',
    });
  }

  close() {
    return this.db.$disconnect();
  }

  load(scope?: ReadScope): Promise<AuditData> {
    if (!scope) throw new Error('Требуется явно указать область чтения');

    return this.transaction((client) => this.read(client, scope), true);
  }

  protected async read(
    client: Prisma.TransactionClient,
    scope: ReadScope,
  ): Promise<AuditData> {
    return this.state(client, {
      events: { workspaceId: { in: [...(scope.workspaceIds ?? [])] } },
    });
  }

  private async state(
    client: Prisma.TransactionClient,
    selected: StateSelection,
  ): Promise<AuditData> {
    const events = selected.events
      ? (await client.auditEvent.findMany({ where: selected.events })).map(fromAuditEvent)
      : [];

    return { events };
  }

  async listEvents(input: QueryInput<'auditEvents'>, userId: string) {
    const filter = input.filter,
      values: unknown[] = [filter.workspaceId],
      where = ['e.workspace_id=$1'];

    addFilter(where, values, 'e.actor_id=?', filter.actorId);
    addFilter(where, values, 'e.target_type=?', filter.targetType);

    if (filter.actions)
      addFilter(where, values, 'e.action=ANY(?::text[])', filter.actions);

    addFilter(where, values, 'e.occurred_at>=?::timestamptz', filter.from);
    addFilter(where, values, 'e.occurred_at<=?::timestamptz', filter.to);

    return selectPage<AuditEvent>(this.sql, {
      select: `e."id" AS "id", e."workspace_id" AS "workspaceId", e."actor_id" AS "actorId", e."action" AS "action", e."target_type" AS "targetType", e."target_id" AS "targetId", e."outcome" AS "outcome", e."occurred_at" AS "occurredAt", e."metadata" AS "metadata"`,
      from: 'audit_events e',
      id: 'e.id',
      where,
      values,
      options: input,
      scope: `audit:${userId}`,
      defaultField: 'CREATED_AT',
      fields: {
        ID: { sql: 'e.id::text', kind: 'string', value: (row) => row.id },
        CREATED_AT: {
          sql: 'e.occurred_at',
          kind: 'date',
          value: (row) => row.occurredAt,
        },
      },
    });
  }
}
