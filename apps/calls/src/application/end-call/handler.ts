import type { CallsData, RequestContext } from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { identifier } from '../../../../../packages/runtime/src/validation';
import type { CallsPolicy } from '../policies/calls.policy';

export async function endCall(
  domain: CallsPolicy,
  input: CommandInput<'endCall'>,
  context: RequestContext,
  data: CallsData,
): Promise<CommandOutput<'endCall'>> {
  const call = data.calls.find((call) => call.id === identifier(input.callId));

  if (
    !call ||
    !(await domain.access.conversationIds(context)).includes(call.conversationId)
  )
    throw new DomainError('NOT_FOUND', 'Звонок недоступен');

  await domain.requireWorkspace(context, call.workspaceId, true);

  if (!['RINGING', 'ACTIVE'].includes(call.status))
    throw new DomainError('INVALID_STATE', 'Звонок уже завершён');

  if (
    call.initiatorId !== context.userId &&
    !(await domain.access.permission(context, call.workspaceId, 'workspace.manage'))
  )
    throw new DomainError('FORBIDDEN', 'Завершить звонок может организатор');

  call.status = 'ENDED';
  call.endedAt = new Date().toISOString();

  for (const p of data.participants.filter(
    (p) => p.callId === call.id && ['JOINED', 'INVITED'].includes(p.status),
  )) {
    p.status = 'LEFT';
    p.leftAt = call.endedAt;
  }

  return { call };
}
