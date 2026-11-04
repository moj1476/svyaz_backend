import { assertMessagePresent } from '../../domain/message';
import type {
  MessagingData,
  RequestContext,
} from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { bool, identifier, text } from '../../../../../packages/runtime/src/validation';
import type { MessagingPolicy } from '../policies/messaging.policy';

export async function setReaction(
  domain: MessagingPolicy,
  input: CommandInput<'setReaction'>,
  context: RequestContext,
  data: MessagingData,
): Promise<CommandOutput<'setReaction'>> {
  const message = data.messages.find((m) => m.id === identifier(input.messageId));

  if (!message) throw new DomainError('NOT_FOUND', 'Сообщение не найдено');

  await domain.conversation(data, context, message.conversationId, true);
  assertMessagePresent(message);
  {
    const emoji = text(input.emoji, 'emoji', 32),
      active = bool(input.active);

    data.reactions = data.reactions.filter(
      (r) =>
        !(r.messageId === message.id && r.userId === context.userId && r.emoji === emoji),
    );

    if (active)
      data.reactions.push({ messageId: message.id, userId: context.userId, emoji });

    return { message };
  }
}
