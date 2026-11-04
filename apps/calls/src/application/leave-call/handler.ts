import type { CallsData, RequestContext } from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { identifier } from '../../../../../packages/runtime/src/validation';
import type { CallsPolicy } from '../policies/calls.policy';

export async function leaveCall(
  _domain: CallsPolicy,
  input: CommandInput<'leaveCall'>,
  context: RequestContext,
  data: CallsData,
): Promise<CommandOutput<'leaveCall'>> {
  const call = data.calls.find(
    (conversation) => conversation.id === identifier(input.callId),
  );

  const participant = data.participants.find(
    (p) => p.callId === call?.id && p.userId === context.userId && p.status === 'JOINED',
  );

  if (!call || !participant)
    throw new DomainError('INVALID_STATE', 'Пользователь не участвует в звонке');

  participant.status = 'LEFT';
  participant.leftAt = new Date().toISOString();

  if (
    ['ACTIVE', 'RINGING'].includes(call.status) &&
    !data.participants.some((p) => p.callId === call.id && p.status === 'JOINED')
  ) {
    call.status = 'ENDED';
    call.endedAt = participant.leftAt;

    for (const invited of data.participants.filter(
      (p) => p.callId === call.id && p.status === 'INVITED',
    )) {
      invited.status = 'LEFT';
      invited.leftAt = call.endedAt;
    }
  }

  return { call };
}
