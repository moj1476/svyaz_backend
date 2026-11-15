import type { MessagingData, RequestContext } from '#contracts';
import { DomainError } from '#contracts/errors';
import type { QueryInput, QueryOutput } from '#contracts/queries';
import { identifier } from '#runtime/validation';
import { dateRange, inDates, page } from '#runtime/read-processing';
import type { MessagingPolicy } from '../policies/messaging.policy';

export async function thread(
  policy: MessagingPolicy,
  input: QueryInput<'thread'>,
  context: RequestContext,
  snapshot: (context: RequestContext) => Promise<MessagingData>,
  _requireWorkspace: (context: RequestContext, id: string) => Promise<void>,
): Promise<QueryOutput<'thread'>> {
  const repository = policy.store;

  if (
    repository.listMessages &&
    repository.getConversationForUser &&
    repository.getRootMessage
  ) {
    dateRange(input.filter ?? {});

    const root = await repository.getRootMessage(identifier(input.rootMessageId));

    if (!root) throw new DomainError('NOT_FOUND', 'Корень не найден');

    const conversationId = root.conversationId,
      rootId = root.id;

    const conversation = await repository.getConversationForUser(
      conversationId,
      context.userId,
    );

    if (
      !conversation ||
      !(await policy.access.workspaceIds(context)).includes(conversation.workspaceId)
    )
      throw new DomainError('NOT_FOUND', 'Обсуждение не найдено');

    return repository.listMessages(input, conversationId, rootId, context.userId);
  }

  const data = await snapshot(context),
    filter = input.filter ?? {};

  dateRange(filter);

  if (filter.senderId) identifier(filter.senderId);

  let conversationId: string;

  {
    const root = data.messages.find(
      (m) => m.id === identifier(input.rootMessageId) && !m.threadRootId,
    );

    if (!root) throw new DomainError('NOT_FOUND', 'Корень не найден');

    conversationId = root.conversationId;
  }

  if (!data.conversations.some((v) => v.id === conversationId))
    throw new DomainError('NOT_FOUND', 'Обсуждение не найдено');

  const rows = data.messages.filter(
    (m) =>
      m.conversationId === conversationId &&
      m.threadRootId === input.rootMessageId &&
      (!filter.senderId || m.senderId === filter.senderId) &&
      (!filter.status || m.status === filter.status) &&
      (!filter.text ||
        (m.body ?? '').toLowerCase().includes(String(filter.text).toLowerCase())) &&
      inDates(m.sentAt, filter),
  );

  return page(
    rows,
    input,
    `thread:${conversationId}:${input.rootMessageId ?? ''}:${context.userId}`,
    {
      SEQUENCE: (m) => BigInt(m.sequence),
      SENT_AT: (m) => m.sentAt,
      ID: (m) => m.id,
    },
    'SEQUENCE',
  );
}
