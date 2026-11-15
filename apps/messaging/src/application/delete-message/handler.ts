import { assertMessagePresent, assertMessageAuthor } from '../../domain/message';
import type { MessagingData, RequestContext } from '#contracts';
import type { CommandInput, CommandOutput } from '#contracts/command-map';
import { DomainError } from '#contracts/errors';
import { identifier } from '#runtime/validation';
import { version } from '#runtime/version';
import type { MessagingPolicy } from '../policies/messaging.policy';

export async function deleteMessage(
  domain: MessagingPolicy,
  input: CommandInput<'deleteMessage'>,
  context: RequestContext,
  data: MessagingData,
): Promise<CommandOutput<'deleteMessage'>> {
  const message = data.messages.find((m) => m.id === identifier(input.messageId));

  if (!message) throw new DomainError('NOT_FOUND', 'Сообщение не найдено');

  await domain.conversation(data, context, message.conversationId, true);
  assertMessagePresent(message);
  assertMessageAuthor(message, context.userId);
  version(message, input.expectedVersion);
  {
    message.body = null;
    message.status = 'DELETED';
    data.reactions = data.reactions.filter((r) => r.messageId !== message.id);
  }

  return { message };
}
