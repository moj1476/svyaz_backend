import { event } from '../../../../packages/contracts/src/events';
import type { CommandEvents } from '../../../../packages/contracts/src/events';

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
