import type { MessagingData, RequestContext } from '#contracts';
import type { CommandInput, CommandOutput } from '#contracts/command-map';
import { DomainError } from '#contracts/errors';
import { identifier } from '#runtime/validation';
import type { MessagingPolicy } from '../policies/messaging.policy';

export async function addConversationMember(
  domain: MessagingPolicy,
  input: CommandInput<'addConversationMember'>,
  context: RequestContext,
  data: MessagingData,
): Promise<CommandOutput<'addConversationMember'>> {
  const conversation = await domain.conversation(
    data,
    context,
    input.conversationId,
    true,
  );

  await domain.manage(conversation, context);

  if (conversation.type === 'DIRECT')
    throw new DomainError('INVALID_STATE', 'Нельзя расширять личный чат');

  const userId = identifier(input.userId);

  if (
    !(await domain.access.workspaceIds({ ...context, userId })).includes(
      conversation.workspaceId,
    )
  )
    throw new DomainError('VALIDATION', 'Нет активного членства');

  const member = data.conversationMembers.find(
    (m) => m.conversationId === conversation.id && m.userId === userId,
  );

  if (member) {
    if (member.status === 'ACTIVE') return { conversation };

    member.status = 'ACTIVE';
    member.joinedSeq = '1';
  } else
    data.conversationMembers.push({
      conversationId: conversation.id,
      userId,
      status: 'ACTIVE' as const,
      joinedSeq: '1',
      lastReadSeq: '0',
    });

  return { conversation: conversation };
}
