import type { ConversationStats } from '../../../../../../packages/contracts/src/queries';

import type { ServiceDatabase } from '../../../../../../packages/storage/src/prisma';
export async function aggregate(db: ServiceDatabase<'messaging'>, workspaceId: string) {
  const now = new Date();
  const [channelCount, messagesLast30Days] = await db.$transaction(
    [
      db.conversation.count({
        where: { workspaceId: workspaceId, type: 'CHANNEL' },
      }),
      db.message.count({
        where: {
          conversations: { workspaceId: workspaceId },
          status: { not: 'DELETED' },
          sentAt: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            lte: now,
          },
        },
      }),
    ],
    { isolationLevel: 'RepeatableRead' },
  );

  return { channelCount, messagesLast30Days: String(messagesLast30Days) };
}
export async function conversationStats(
  db: ServiceDatabase<'messaging'>,
  conversationId: string,
  userId: string,
): Promise<ConversationStats> {
  return db.$transaction(
    async (client) => {
      const member = await client.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
      });

      const roots = { conversationId, threadRootId: null, status: { not: 'DELETED' } };
      const [
        messageCount,
        replyCount,
        deletedCount,
        participantCount,
        unreadCount,
        latest,
      ] = await Promise.all([
        client.message.count({ where: roots }),
        client.message.count({
          where: {
            conversationId,
            threadRootId: { not: null },
            status: { not: 'DELETED' },
          },
        }),
        client.message.count({ where: { conversationId, status: 'DELETED' } }),
        client.conversationMember.count({
          where: { conversationId, status: 'ACTIVE' },
        }),
        member
          ? client.message.count({
              where: {
                ...roots,
                senderId: { not: userId },
                sequence: { gt: member.lastReadSeq },
              },
            })
          : Promise.resolve(0),
        client.message.aggregate({
          where: { conversationId },
          _max: { sequence: true },
        }),
      ]);

      return {
        conversationId,
        messageCount,
        replyCount,
        deletedCount,
        participantCount,
        unreadCount,
        lastSequence: (latest._max.sequence ?? 0n).toString(),
      };
    },
    { isolationLevel: 'RepeatableRead' },
  );
}
