import { randomUUID } from 'node:crypto';
import type { CallsData, RequestContext } from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { identifier } from '../../../../../packages/runtime/src/validation';
import type { CallsPolicy } from '../policies/calls.policy';

export async function joinCall(
  domain: CallsPolicy,
  input: CommandInput<'joinCall'>,
  context: RequestContext,
  data: CallsData,
): Promise<CommandOutput<'joinCall'>> {
  const call = data.calls.find((call) => call.id === identifier(input.callId));

  if (
    !call ||
    !(await domain.access.conversationIds(context)).includes(call.conversationId)
  )
    throw new DomainError('NOT_FOUND', 'Звонок недоступен');

  await domain.requireWorkspace(context, call.workspaceId, true);

  if (!['RINGING', 'ACTIVE'].includes(call.status))
    throw new DomainError('INVALID_STATE', 'Звонок уже завершён');

  if (!(await domain.access.conversationActive(context, call.conversationId)))
    throw new DomainError(
      'INVALID_STATE',
      'Нельзя войти в звонок архивированного обсуждения',
    );

  let participant = data.participants.find(
    (p) => p.callId === call.id && p.userId === context.userId,
  );

  if (!participant) {
    participant = {
      id: randomUUID(),
      callId: call.id,
      userId: context.userId,
      status: 'JOINED' as const,
      joinedAt: new Date().toISOString(),
      leftAt: null,
    };
    data.participants.push(participant);
  } else if (participant.status !== 'JOINED') {
    participant.status = 'JOINED';
    participant.joinedAt = new Date().toISOString();
    participant.leftAt = null;
  }

  call.status = 'ACTIVE';

  return { call };
}
