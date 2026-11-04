import { randomUUID } from 'node:crypto';
import type { CallsData, RequestContext } from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { identifier } from '../../../../../packages/runtime/src/validation';
import type { CallsPolicy } from '../policies/calls.policy';

export async function startCall(
  domain: CallsPolicy,
  input: CommandInput<'startCall'>,
  context: RequestContext,
  data: CallsData,
): Promise<CommandOutput<'startCall'>> {
  const conversationId = identifier(input.conversationId);

  if (!(await domain.access.conversationIds(context)).includes(conversationId))
    throw new DomainError('NOT_FOUND', 'Обсуждение недоступно');

  const workspaceId = await domain.access.conversationWorkspace(context, conversationId);

  await domain.requireWorkspace(context, workspaceId, true);

  if (!(await domain.access.conversationActive(context, conversationId)))
    throw new DomainError(
      'INVALID_STATE',
      'Нельзя начать звонок в архивированном обсуждении',
    );

  if (!['AUDIO', 'VIDEO'].includes(String(input.mode)))
    throw new DomainError('VALIDATION', 'Неверный режим звонка');

  const inviteeIds = [...new Set(input.inviteeIds ?? [])].filter(
    (userId) => userId !== context.userId,
  );

  if ((input.inviteeIds?.length ?? 0) > 100)
    throw new DomainError('VALIDATION', 'Не более 100 приглашённых', 'inviteeIds');

  for (const userId of inviteeIds) {
    if (
      !(await domain.access.userExists(userId, context)) ||
      !(await domain.access.conversationIds({ ...context, userId })).includes(
        conversationId,
      )
    )
      throw new DomainError(
        'VALIDATION',
        'Приглашённый не имеет доступа к обсуждению',
        'inviteeIds',
      );
  }

  const current = data.calls.find(
    (call) =>
      call.conversationId === conversationId &&
      ['RINGING', 'ACTIVE'].includes(call.status),
  );

  if (current) throw new DomainError('CONFLICT', 'Уже есть активный звонок');

  const now = new Date().toISOString(),
    call = {
      id: randomUUID(),
      workspaceId,
      conversationId,
      mode: input.mode,
      status: 'ACTIVE' as const,
      startedAt: now,
      endedAt: null,
      initiatorId: context.userId,
    };

  data.calls.push(call);
  data.participants.push({
    id: randomUUID(),
    callId: call.id,
    userId: context.userId,
    status: 'JOINED' as const,
    joinedAt: now,
    leftAt: null,
  });

  for (const userId of inviteeIds)
    data.participants.push({
      id: randomUUID(),
      callId: call.id,
      userId,
      status: 'INVITED',
      joinedAt: null,
      leftAt: null,
    });

  return { call };
}
