import type { MessagingData, RequestContext } from '#contracts';
import type { CommandInput, CommandOutput } from '#contracts/command-map';
import { DomainError } from '#contracts/errors';
import { text } from '#runtime/validation';
import { version } from '#runtime/version';
import type { MessagingPolicy } from '../policies/messaging.policy';

export async function updateConversation(
  domain: MessagingPolicy,
  input: CommandInput<'updateConversation'>,
  context: RequestContext,
  data: MessagingData,
): Promise<CommandOutput<'updateConversation'>> {
  const conversation = await domain.conversation(
    data,
    context,
    input.conversationId,
    true,
  );

  await domain.manage(conversation, context);

  if (conversation.type === 'DIRECT')
    throw new DomainError(
      'INVALID_STATE',
      'Название личного чата не изменяется',
      'title',
    );

  const title = text(input.title, 'title', 200);

  version(conversation, input.expectedVersion);
  conversation.title = title;

  return { conversation };
}
