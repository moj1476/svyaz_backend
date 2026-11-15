import { event } from '#contracts/events';
import type { CommandEvents } from '#contracts/events';

export const events: CommandEvents<'notifications'> = {
  markNotificationRead: (_input, output, context) => [
    event(
      'notification.read_state_changed.v1',
      'notification',
      output.notification.id,
      output.notification.workspaceId,
      context,
    ),
  ],
};
