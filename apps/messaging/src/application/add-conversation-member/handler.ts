import type {
  MessagingData,
  RequestContext,
} from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { identifier } from '../../../../../packages/runtime/src/validation';
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
