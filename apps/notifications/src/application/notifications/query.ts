import type {
  NotificationsData,
  RequestContext,
} from '../../../../../packages/contracts/src';
import type {
  QueryInput,
  QueryOutput,
} from '../../../../../packages/contracts/src/queries';
import { identifier } from '../../../../../packages/runtime/src/validation';
import {
  dateRange,
  inDates,
  page,
} from '../../../../../packages/runtime/src/read-processing';
import type { NotificationsPolicy } from '../policies/notifications.policy';

export async function notifications(
  policy: NotificationsPolicy,
  input: QueryInput<'notifications'>,
  context: RequestContext,
  snapshot: (context: RequestContext) => Promise<NotificationsData>,
  requireWorkspace: (context: RequestContext, id: string) => Promise<void>,
): Promise<QueryOutput<'notifications'>> {
  if (policy.store.listNotifications) {
    dateRange(input.filter ?? {});

    if (input.workspaceId) await requireWorkspace(context, identifier(input.workspaceId));

    return policy.store.listNotifications(
      input,
      context.userId,
      await policy.access.workspaceIds(context),
    );
  }

  const data = await snapshot(context),
    filter = input.filter ?? {};

  dateRange(filter);

  if (input.workspaceId) await requireWorkspace(context, identifier(input.workspaceId));

  const rows = data.notifications.filter(
    (n) =>
      (!input.workspaceId || n.workspaceId === input.workspaceId) &&
      (!input.unreadOnly || !n.readAt) &&
      (!filter.type || n.type === filter.type) &&
      inDates(n.createdAt, filter),
  );

  return page(
    rows,
    input,
    `notifications:${context.userId}:${input.workspaceId ?? ''}:${input.unreadOnly ?? false}`,
    { CREATED_AT: (n) => n.createdAt, ID: (n) => n.id },
    'CREATED_AT',
  );
}
