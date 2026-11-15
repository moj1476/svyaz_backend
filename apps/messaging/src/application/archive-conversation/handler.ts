import type { MessagingData, RequestContext } from '#contracts';
import type { CommandInput, CommandOutput } from '#contracts/command-map';
import { version } from '#runtime/version';
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
