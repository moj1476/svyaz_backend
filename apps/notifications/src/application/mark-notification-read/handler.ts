import type {
  NotificationsData,
  RequestContext,
} from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { bool, identifier } from '../../../../../packages/runtime/src/validation';
import type { NotificationsPolicy } from '../policies/notifications.policy';

export async function markNotificationRead(
  domain: NotificationsPolicy,
  input: CommandInput<'markNotificationRead'>,
  context: RequestContext,
  data: NotificationsData,
): Promise<CommandOutput<'markNotificationRead'>> {
  const notification = data.notifications.find(
    (n) => n.id === identifier(input.id) && n.recipientId === context.userId,
  );

  if (!notification) throw new DomainError('NOT_FOUND', 'Уведомление не найдено');

  await domain.requireWorkspace(context, notification.workspaceId);
  notification.readAt = bool(input.read)
    ? (notification.readAt ?? new Date().toISOString())
    : null;

  return { notification };
}
