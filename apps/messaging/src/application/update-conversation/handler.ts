import type {
  MessagingData,
  RequestContext,
} from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { text } from '../../../../../packages/runtime/src/validation';
import { version } from '../../../../../packages/runtime/src/version';
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
