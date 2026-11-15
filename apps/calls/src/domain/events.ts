import { event } from '#contracts/events';
import type { CommandEvents } from '#contracts/events';

export const events: CommandEvents<'calls'> = {
  startCall: (_input, output, context) => [
    event('call.started.v1', 'call', output.call.id, output.call.workspaceId, context),
  ],
  joinCall: (_input, output, context) => [
    event(
      'call.participant_joined.v1',
      'call',
      output.call.id,
      output.call.workspaceId,
      context,
    ),
  ],
  leaveCall: (_input, output, context) => [
    event(
      'call.participant_left.v1',
      'call',
      output.call.id,
      output.call.workspaceId,
      context,
    ),
  ],
  endCall: (_input, output, context) => [
    event('call.ended.v1', 'call', output.call.id, output.call.workspaceId, context),
  ],
};
