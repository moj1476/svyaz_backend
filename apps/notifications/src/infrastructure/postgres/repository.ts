import type {
  Notification,
  NotificationsData,
} from '../../../../../packages/contracts/src';
import type { QueryInput } from '../../../../../packages/contracts/src/queries';
import { addFilter, selectPage } from '../../../../../packages/storage/src/page';
import type { Prisma } from '../../../../../generated/notifications/client';
import type { ReadScope } from '../../../../../packages/contracts/src/read-scope';
import { databaseFor, sqlExecutor } from '../../../../../packages/storage/src/prisma';
import {
  TransactionalRepository,
  type CommandSelection,
} from '../../../../../packages/storage/src/transactional-repository';
import type { RequestContext } from '../../../../../packages/contracts/src';
import { canonical, assertUpdated } from '../../../../../packages/storage/src/values';
import { fromNotification, toNotification } from './mapping';

interface StateSelection {
  notifications?: Prisma.NotificationWhereInput;
}

export class Repository extends TransactionalRepository<
  NotificationsData,
  Prisma.TransactionClient
> {
  readonly db = databaseFor('notifications');
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

  protected async read(
    client: Prisma.TransactionClient,
    scope: ReadScope,
  ): Promise<NotificationsData> {
    return this.state(client, {
      notifications: {
        recipientId: scope.actorId ?? '00000000-0000-0000-0000-000000000000',
        workspaceId: { in: [...(scope.workspaceIds ?? [])] },
      },
    });
  }

  private async state(
    client: Prisma.TransactionClient,
    selected: StateSelection,
  ): Promise<NotificationsData> {
    const notifications = selected.notifications
      ? (await client.notification.findMany({ where: selected.notifications })).map(
          fromNotification,
        )
      : [];

    return { notifications };
  }

  protected async command(
    client: Prisma.TransactionClient,
    _operation: string,
    input: Record<string, unknown>,
    context: RequestContext,
  ): Promise<CommandSelection<NotificationsData>> {
    const id = String(input.id);

    return {
      lock: 'notification:' + id,
      load: () =>
        this.state(client, { notifications: { id, recipientId: context.userId } }),
    };
  }

  protected async save(
    client: Prisma.TransactionClient,
    before: NotificationsData,
    after: NotificationsData,
  ): Promise<void> {
    {
      const previous = new Map((before.notifications ?? []).map((row) => [row.id, row]));

      for (const row of after.notifications ?? []) {
        const prior = previous.get(row.id);

        if (prior && canonical(prior) === canonical(row)) continue;

        const data = toNotification(row);

        if (!prior) await client.notification.create({ data });
        else {
          const updated = await client.notification.updateMany({
            where: { id: row.id },
            data,
          });

          assertUpdated(updated.count);
        }
      }
    }

    for (const row of before.notifications ?? []) {
      if (!(after.notifications ?? []).some((item) => item.id === row.id))
        await client.notification.deleteMany({ where: { id: row.id } });
    }
  }

  async listNotifications(
    input: QueryInput<'notifications'>,
    userId: string,
    workspaceIds: string[],
  ) {
    const filter = input.filter ?? {},
      values: unknown[] = [userId, workspaceIds],
      where = ['n.recipient_id=$1', 'n.workspace_id=ANY($2::uuid[])'];

    addFilter(where, values, 'n.workspace_id=?', input.workspaceId);
    addFilter(where, values, 'n.type=?', filter.type);

    if (input.unreadOnly) where.push('n.read_at IS NULL');

    addFilter(where, values, 'n.created_at>=?::timestamptz', filter.from);
    addFilter(where, values, 'n.created_at<=?::timestamptz', filter.to);

    return selectPage<Notification>(this.sql, {
      select: `n."id" AS "id", n."workspace_id" AS "workspaceId", n."recipient_id" AS "recipientId", n."type" AS "type", n."target_type" AS "targetType", n."target_id" AS "targetId", n."source_event_id" AS "sourceEventId", n."preview" AS "preview", n."created_at" AS "createdAt", n."read_at" AS "readAt"`,
      from: 'notifications n',
      id: 'n.id',
      where,
      values,
      options: input,
      scope: `notifications:${userId}:${input.workspaceId ?? ''}:${input.unreadOnly ?? false}`,
      defaultField: 'CREATED_AT',
      fields: {
        ID: { sql: 'n.id::text', kind: 'string', value: (row) => row.id },
        CREATED_AT: { sql: 'n.created_at', kind: 'date', value: (row) => row.createdAt },
      },
    });
  }
}
