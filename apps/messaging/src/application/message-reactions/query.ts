import type {
  MessagingData,
  RequestContext,
} from '../../../../../packages/contracts/src';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import type {
  QueryInput,
  QueryOutput,
} from '../../../../../packages/contracts/src/queries';
import { identifier } from '../../../../../packages/runtime/src/validation';
import type { MessagingPolicy } from '../policies/messaging.policy';

export async function messageReactions(
  _policy: MessagingPolicy,
  input: QueryInput<'messageReactions'>,
  context: RequestContext,
  snapshot: (context: RequestContext) => Promise<MessagingData>,
  _requireWorkspace: (context: RequestContext, id: string) => Promise<void>,
): Promise<QueryOutput<'messageReactions'>> {
  const data = await snapshot(context);
  const messageId = identifier(input.messageId);

  if (!data.messages.some((m) => m.id === messageId))
    throw new DomainError('NOT_FOUND', 'Сообщение не найдено');

  const reactions = data.reactions.filter((r) => r.messageId === messageId);

  return [...new Set(reactions.map((r) => r.emoji))].map((emoji) => ({
    emoji,
    count: reactions.filter((r) => r.emoji === emoji).length,
    reactedByMe: reactions.some((r) => r.emoji === emoji && r.userId === context.userId),
  }));
}
