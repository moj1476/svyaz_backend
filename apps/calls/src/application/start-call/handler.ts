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

  if (Array.isArray(input.inviteeIds) && input.inviteeIds.length)
    throw new DomainError(
      'VALIDATION',
      'Приглашения во звонок будут реализованы с доставкой уведомлений',
    );

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

  return { call };
}
