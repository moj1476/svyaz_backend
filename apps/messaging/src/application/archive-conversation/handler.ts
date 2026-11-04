import type {
  MessagingData,
  RequestContext,
} from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { version } from '../../../../../packages/runtime/src/version';
import type { MessagingPolicy } from '../policies/messaging.policy';

export async function archiveConversation(
  domain: MessagingPolicy,
  input: CommandInput<'archiveConversation'>,
  context: RequestContext,
  data: MessagingData,
): Promise<CommandOutput<'archiveConversation'>> {
  const conversation = await domain.conversation(
    data,
    context,
    input.conversationId,
    true,
  );

  await domain.manage(conversation, context);
  version(conversation, input.expectedVersion);
  conversation.status = 'ARCHIVED';

  return { conversation: conversation };
}
