import type { NotificationsData, RequestContext } from '#contracts';
import type { CommandInput, CommandOutput } from '#contracts/command-map';
import { DomainError } from '#contracts/errors';
import { bool, identifier } from '#runtime/validation';
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
