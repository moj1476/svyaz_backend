import type {
  MessagingData,
  RequestContext,
} from '../../../../../packages/contracts/src';
import type {
  QueryInput,
  QueryOutput,
} from '../../../../../packages/contracts/src/queries';
import { identifier } from '../../../../../packages/runtime/src/validation';
import { page } from '../../../../../packages/runtime/src/read-processing';
import type { MessagingPolicy } from '../policies/messaging.policy';

export async function conversations(
  policy: MessagingPolicy,
  input: QueryInput<'conversations'>,
  context: RequestContext,
  snapshot: (context: RequestContext) => Promise<MessagingData>,
  requireWorkspace: (context: RequestContext, id: string) => Promise<void>,
): Promise<QueryOutput<'conversations'>> {
  if (policy.store.listConversations) {
    await requireWorkspace(context, identifier(input.workspaceId));

    return policy.store.listConversations(input, context.userId);
  }

  const data = await snapshot(context),
    filter = input.filter ?? {};

  const workspaceId = identifier(input.workspaceId);

  await requireWorkspace(context, workspaceId);

  const rows = data.conversations.filter(
    (v) =>
      v.workspaceId === workspaceId &&
      (!filter.type || v.type === filter.type) &&
      (!filter.status || v.status === filter.status) &&
      (!filter.visibility || v.visibility === filter.visibility) &&
      (!filter.text ||
        (v.title ?? '').toLowerCase().includes(String(filter.text).toLowerCase())),
  );

  return page(
    rows,
    input,
    `conversations:${workspaceId}:${context.userId}`,
    { ID: (v) => v.id, TITLE: (v) => v.title ?? '', TYPE: (v) => v.type },
    'ID',
  );
}
