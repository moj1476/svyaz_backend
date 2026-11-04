import { event } from '../../../../packages/contracts/src/events';
import type { CommandEvents } from '../../../../packages/contracts/src/events';

export const events: CommandEvents<'identity'> = {
  updateProfile: (_input, output, context) => [
    event('user.updated.v1', 'user', output.user.id, null, context),
  ],
  revokeSession: (_input, output, context) => [
    event('session.revoked.v1', 'session', output.session.id, null, context),
  ],
};
