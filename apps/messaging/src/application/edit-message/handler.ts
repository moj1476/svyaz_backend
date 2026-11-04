import { assertMessagePresent, assertMessageAuthor } from '../../domain/message';
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
import { version } from '../../../../../packages/runtime/src/version';
import type { MessagingPolicy } from '../policies/messaging.policy';

export async function editMessage(
  domain: MessagingPolicy,
  input: CommandInput<'editMessage'>,
  context: RequestContext,
  data: MessagingData,
): Promise<CommandOutput<'editMessage'>> {
  const message = data.messages.find((m) => m.id === identifier(input.messageId));

  if (!message) throw new DomainError('NOT_FOUND', 'Сообщение не найдено');

  await domain.conversation(data, context, message.conversationId, true);
  assertMessagePresent(message);
  assertMessageAuthor(message, context.userId);

  const priorVersion = message.version,
    priorBody = message.body;

  version(message, input.expectedVersion);
  {
    data.revisions ??= [];
    data.revisions.push({
      id: randomUUID(),
      messageId: message.id,
      revisionNo: priorVersion,
      body: priorBody,
      editedAt: new Date().toISOString(),
    });
  }
  {
    message.body = text(input.body, 'body', 4000);
    message.status = 'EDITED';
    message.editedAt = new Date().toISOString();
  }

  return { message };
}
