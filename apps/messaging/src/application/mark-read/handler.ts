import type {
  MessagingData,
  RequestContext,
} from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { exactVersion } from '../../../../../packages/runtime/src/version';
import type { MessagingPolicy } from '../policies/messaging.policy';

export async function markRead(
  domain: MessagingPolicy,
  input: CommandInput<'markRead'>,
  context: RequestContext,
  data: MessagingData,
): Promise<CommandOutput<'markRead'>> {
  const conversation = await domain.conversation(data, context, input.conversationId);
  const seq = input.sequence === '0' ? 0n : exactVersion(input.sequence);
  const highest = data.messages
    .filter((m) => m.conversationId === conversation.id)
    .reduce((n, m) => (BigInt(m.sequence) > n ? BigInt(m.sequence) : n), 0n);

  if (seq > highest)
    throw new DomainError('VALIDATION', 'Позиция выше последнего сообщения');

  if (
    data.messages.some(
      (m) =>
        m.conversationId === conversation.id &&
        BigInt(m.sequence) === seq &&
        m.threadRootId,
    )
  )
    throw new DomainError('VALIDATION', 'Основная лента не отмечает ответы веток');

  const member = data.conversationMembers.find(
    (m) => m.conversationId === conversation.id && m.userId === context.userId,
  )!;

  if (seq > BigInt(member.lastReadSeq)) member.lastReadSeq = String(seq);

  return {
    readState: { conversationId: conversation.id, sequence: member.lastReadSeq },
  };
}
