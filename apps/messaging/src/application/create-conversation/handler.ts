import { randomUUID } from 'node:crypto';
import type {
  MessagingData,
  RequestContext,
} from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { identifier, text } from '../../../../../packages/runtime/src/validation';
import type { MessagingPolicy } from '../policies/messaging.policy';

export async function createConversation(
  domain: MessagingPolicy,
  input: CommandInput<'createConversation'>,
  context: RequestContext,
  data: MessagingData,
): Promise<CommandOutput<'createConversation'>> {
  const workspaceId = identifier(input.workspaceId);

  await domain.requireWorkspace(context, workspaceId, true);

  if (
    !['CHANNEL', 'DIRECT', 'GROUP'].includes(String(input.type)) ||
    !['PUBLIC', 'PRIVATE'].includes(String(input.visibility))
  )
    throw new DomainError('VALIDATION', 'Неверный тип обсуждения');

  if (!Array.isArray(input.memberIds) || input.memberIds.length > 100)
    throw new DomainError('VALIDATION', 'Не более 100 участников');

  const memberIds = [
    ...new Set([context.userId, ...input.memberIds.map((id) => identifier(id))]),
  ];

  if (memberIds.length > 100)
    throw new DomainError('VALIDATION', 'Не более 100 участников вместе с создателем');

  if (input.type === 'DIRECT' && memberIds.length !== 2)
    throw new DomainError('VALIDATION', 'Личный чат должен содержать двух участников');

  if (input.type !== 'CHANNEL' && input.visibility !== 'PRIVATE')
    throw new DomainError('VALIDATION', 'Личные и групповые чаты закрыты');

  for (const userId of memberIds)
    if (!(await domain.access.workspaceIds({ ...context, userId })).includes(workspaceId))
      throw new DomainError('VALIDATION', 'Участник не состоит в пространстве');

  if (input.type === 'DIRECT') {
    const existing = data.conversations.find(
      (conversation) =>
        conversation.workspaceId === workspaceId &&
        conversation.type === 'DIRECT' &&
        conversation.status === 'ACTIVE' &&
        data.conversationMembers.filter(
          (m) => m.conversationId === conversation.id && m.status === 'ACTIVE',
        ).length === 2 &&
        memberIds.every((user) =>
          data.conversationMembers.some(
            (m) =>
              m.conversationId === conversation.id &&
              m.userId === user &&
              m.status === 'ACTIVE',
          ),
        ),
    );

    if (existing) return { conversation: existing };
  }

  const conversation = {
    id: randomUUID(),
    workspaceId,
    type: input.type,
    visibility: input.visibility,
    title: input.type === 'DIRECT' ? null : text(input.title, 'title', 200),
    status: 'ACTIVE' as const,
    version: '1',
    createdBy: context.userId,
  };

  data.conversations.push(conversation);

  for (const userId of memberIds)
    data.conversationMembers.push({
      conversationId: conversation.id,
      userId,
      status: 'ACTIVE' as const,
      joinedSeq: '1',
      lastReadSeq: '0',
    });

  return { conversation };
}
