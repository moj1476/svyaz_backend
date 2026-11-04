import type {
  MessagingData,
  ReadRepository,
  RequestContext,
  ServiceClient,
} from '../../../../packages/contracts/src';
import type { AccessClient } from '../../../../packages/contracts/src/access';

export class ReadService implements ServiceClient<'messaging'> {
  constructor(
    private readonly repository: ReadRepository<MessagingData>,
    private readonly access: AccessClient,
  ) {}

  async snapshot(context: RequestContext): Promise<MessagingData> {
    const access = this.access;
    const workspaces = new Set(await access.workspaceIds(context));
    const data = await this.repository.load({
      actorId: context.userId,
      workspaceIds: [...workspaces],
    });

    const conversations = data.conversations.filter(
      (c) =>
        workspaces.has(c.workspaceId) &&
        data.conversationMembers.some(
          (m) =>
            m.conversationId === c.id &&
            m.userId === context.userId &&
            m.status === 'ACTIVE',
        ),
    );

    const ids = new Set(conversations.map((c) => c.id));
    const messages = data.messages
      .filter((m) => ids.has(m.conversationId))
      .map((m) => ({ ...m, body: m.status === 'DELETED' ? null : m.body }));

    return {
      conversations,
      conversationMembers: data.conversationMembers.filter((m) =>
        ids.has(m.conversationId),
      ),
      messages,
      reactions: data.reactions.filter((r) => messages.some((m) => m.id === r.messageId)),
    };
  }
}
