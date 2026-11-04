import type {
  MessagingData,
  RequestContext,
} from '../../../../../packages/contracts/src';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import type {
  QueryInput,
  QueryOutput,
} from '../../../../../packages/contracts/src/queries';
import { identifier } from '../../../../../packages/runtime/src/validation';
import type { MessagingPolicy } from '../policies/messaging.policy';

export async function conversationStats(
  policy: MessagingPolicy,
  input: QueryInput<'conversationStats'>,
  context: RequestContext,
  snapshot: (context: RequestContext) => Promise<MessagingData>,
  _requireWorkspace: (context: RequestContext, id: string) => Promise<void>,
): Promise<QueryOutput<'conversationStats'>> {
  if (policy.store.conversationStats && policy.store.getConversationForUser) {
    const id = identifier(input.conversationId),
      conversation = await policy.store.getConversationForUser(id, context.userId);

    if (
      !conversation ||
      !(await policy.access.workspaceIds(context)).includes(conversation.workspaceId)
    )
      throw new DomainError('NOT_FOUND', 'Обсуждение не найдено');

    return policy.store.conversationStats(id, context.userId);
  }

  const data = await snapshot(context);
  const id = identifier(input.conversationId);

  if (!data.conversations.some((v) => v.id === id))
    throw new DomainError('NOT_FOUND', 'Обсуждение не найдено');

  const rows = data.messages.filter((m) => m.conversationId === id),
    member = data.conversationMembers.find(
      (m) => m.conversationId === id && m.userId === context.userId,
    )!;

  return {
    conversationId: id,
    messageCount: rows.filter((m) => !m.threadRootId && m.status !== 'DELETED').length,
    replyCount: rows.filter((m) => !!m.threadRootId && m.status !== 'DELETED').length,
    deletedCount: rows.filter((m) => m.status === 'DELETED').length,
    participantCount: data.conversationMembers.filter(
      (m) => m.conversationId === id && m.status === 'ACTIVE',
    ).length,
    unreadCount: rows.filter(
      (m) =>
        !m.threadRootId &&
        m.status !== 'DELETED' &&
        m.senderId !== context.userId &&
        BigInt(m.sequence) > BigInt(member.lastReadSeq),
    ).length,
    lastSequence: rows
      .reduce((v, m) => (BigInt(m.sequence) > v ? BigInt(m.sequence) : v), 0n)
      .toString(),
  };
}
