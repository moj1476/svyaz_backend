import { events } from './domain/events';
import type { MessagingData, RequestContext } from '../../../packages/contracts/src';
import type { AccessClient } from '../../../packages/contracts/src/access';
import type { TransactionStore } from '../../../packages/contracts/src/commands';
import { DomainError } from '../../../packages/contracts/src/errors';
import { identifier } from '../../../packages/runtime/src/validation';
import { queryDispatcher } from '../../../packages/runtime/src/query-dispatch';
import { ServiceBase } from '../../../packages/runtime/src/service-base';
import { ReadService } from './application';
import { addConversationMember } from './application/add-conversation-member/handler';
import { archiveConversation } from './application/archive-conversation/handler';
import { conversationStats } from './application/conversation-stats/query';
import { conversations } from './application/conversations/query';
import { createConversation } from './application/create-conversation/handler';
import { deleteMessage } from './application/delete-message/handler';
import { editMessage } from './application/edit-message/handler';
import { markRead } from './application/mark-read/handler';
import { messageReactions } from './application/message-reactions/query';
import { messages } from './application/messages/query';
import { sendMessage } from './application/send-message/handler';
import { setReaction } from './application/set-reaction/handler';
import { thread } from './application/thread/query';
import { MessagingPolicy } from './application/policies/messaging.policy';

export class BusinessService extends ServiceBase<'messaging'> {
  private readonly policy: MessagingPolicy;

  constructor(store: TransactionStore<MessagingData>, access: AccessClient) {
    const policy = new MessagingPolicy(store, access);

    super(
      'messaging',
      store,
      access,
      new ReadService(store, access),
      {
        createConversation: (input, context, data) =>
          createConversation(policy, input, context, data),
        sendMessage: (input, context, data) => sendMessage(policy, input, context, data),
        editMessage: (input, context, data) => editMessage(policy, input, context, data),
        deleteMessage: (input, context, data) =>
          deleteMessage(policy, input, context, data),
        setReaction: (input, context, data) => setReaction(policy, input, context, data),
        archiveConversation: (input, context, data) =>
          archiveConversation(policy, input, context, data),
        addConversationMember: (input, context, data) =>
          addConversationMember(policy, input, context, data),
        markRead: (input, context, data) => markRead(policy, input, context, data),
      },
      events,
      policy.authorize.bind(policy),
    );
    this.policy = policy;
  }

  private requireWorkspace(context: RequestContext, workspaceId: string, write = false) {
    return this.policy.requireWorkspace(context, workspaceId, write);
  }

  query = queryDispatcher({
    messageReactions: (input, context) =>
      messageReactions(
        this.policy,
        input,
        context,
        this.snapshot.bind(this),
        this.requireWorkspace.bind(this),
      ),
    conversationStats: (input, context) =>
      conversationStats(
        this.policy,
        input,
        context,
        this.snapshot.bind(this),
        this.requireWorkspace.bind(this),
      ),
    conversations: (input, context) =>
      conversations(
        this.policy,
        input,
        context,
        this.snapshot.bind(this),
        this.requireWorkspace.bind(this),
      ),
    messages: (input, context) =>
      messages(
        this.policy,
        input,
        context,
        this.snapshot.bind(this),
        this.requireWorkspace.bind(this),
      ),
    thread: (input, context) =>
      thread(
        this.policy,
        input,
        context,
        this.snapshot.bind(this),
        this.requireWorkspace.bind(this),
      ),
  });

  async statistics(workspaceId: string, context: RequestContext) {
    await this.requireWorkspace(context, identifier(workspaceId));

    if (!(await this.access.permission(context, workspaceId, 'workspace.dashboard.read')))
      throw new DomainError('FORBIDDEN', 'Нет права сводки');

    if (this.store.aggregate) return this.store.aggregate(workspaceId);

    const data = await this.store.load({
        workspaceIds: [workspaceId],
        actorId: context.userId,
      }),
      ids = data.conversations
        .filter((conversation) => conversation.workspaceId === workspaceId)
        .map((conversation) => conversation.id);

    const now = Date.now(),
      since = now - 30 * 86400000;

    return {
      channelCount: data.conversations.filter(
        (conversation) =>
          conversation.workspaceId === workspaceId && conversation.type === 'CHANNEL',
      ).length,
      messagesLast30Days: String(
        data.messages.filter(
          (m) =>
            ids.includes(m.conversationId) &&
            m.status !== 'DELETED' &&
            Date.parse(m.sentAt) >= since &&
            Date.parse(m.sentAt) <= now,
        ).length,
      ),
    };
  }
}
