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

export async function sendMessage(
  domain: MessagingPolicy,
  input: CommandInput<'sendMessage'>,
  context: RequestContext,
  data: MessagingData,
): Promise<CommandOutput<'sendMessage'>> {
  const conversation = await domain.conversation(
      data,
      context,
      input.conversationId,
      true,
    ),
    clientMessageId = identifier(input.clientMessageId);

  if (
    data.messages.some(
      (m) =>
        m.conversationId === conversation.id && m.clientMessageId === clientMessageId,
    )
  )
    throw new DomainError('CONFLICT', 'clientMessageId уже занят');

  if (Array.isArray(input.fileIds) && input.fileIds.length)
    throw new DomainError(
      'VALIDATION',
      'Привязка новых вложений относится к File workflow следующего этапа',
    );

  const root = input.threadRootId == null ? null : identifier(input.threadRootId);

  if (
    root &&
    !data.messages.some(
      (m) =>
        m.id === root &&
        m.conversationId === conversation.id &&
        !m.threadRootId &&
        m.status !== 'DELETED',
    )
  )
    throw new DomainError('VALIDATION', 'Недопустимый корень ветки');

  const highest = data.messages
    .filter((m) => m.conversationId === conversation.id)
    .reduce((n, m) => (BigInt(m.sequence) > n ? BigInt(m.sequence) : n), 0n);

  if (highest === 9223372036854775807n)
    throw new DomainError('CONFLICT', 'Диапазон sequence исчерпан');

  const message = {
    id: randomUUID(),
    conversationId: conversation.id,
    senderId: context.userId,
    clientMessageId,
    sequence: String(highest + 1n),
    body: text(input.body, 'body', 4000),
    status: 'SENT' as const,
    threadRootId: root,
    sentAt: new Date().toISOString(),
    editedAt: null,
    version: '1',
  };

  data.messages.push(message);

  return { message };
}
