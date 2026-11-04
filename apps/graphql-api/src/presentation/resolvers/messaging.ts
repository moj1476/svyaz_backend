import type {
  Conversation,
  Message,
  Clients,
} from '../../../../../packages/contracts/src';
import type { RequestData } from '../../context/request-data';
import type { FieldResolvers } from './types';
import { connection } from '../../../../../packages/contracts/src/pagination';
export function messagingFields(source: RequestData, clients: Clients): FieldResolvers {
  return {
    Conversation: {
      members: async (parent, args, context) => {
        const conversation = parent as Conversation;
        const m = await source.data('messaging', context);
        const workspaceData = await source.data('workspace', context);
        const members = m.conversationMembers.filter(
          (cm) => cm.conversationId === conversation.id && cm.status === 'ACTIVE',
        );

        return connection(
          workspaceData.memberships.filter(
            (wm) =>
              wm.workspaceId === conversation.workspaceId &&
              members.some((cm) => cm.userId === wm.userId),
          ),
          args,
          `conversation-members:${conversation.id}:${context.userId}`,
          (wm) => wm.id,
        );
      },
      unreadCount: async (parent, _a, context) => {
        const result = (await clients.messaging.query!(
          'conversationStats',
          { conversationId: (parent as Conversation).id },
          context,
        )) as { unreadCount: number };

        return result.unreadCount;
      },
    },
    Message: {
      sender: async (parent, _a, context) => {
        return source.user(context, (parent as Message).senderId);
      },
      attachments: async (parent, _a, context) => {
        return (await source.data('files', context)).attachments.filter(
          (at) => at.messageId === (parent as Message).id,
        );
      },
      reactions: async (parent, _a, context) => {
        return clients.messaging.query!(
          'messageReactions',
          { messageId: (parent as Message).id },
          context,
        );
      },
    },
  };
}
