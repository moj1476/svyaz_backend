import type { ServiceDatabase } from '#storage/prisma';

export async function messageRecipients(db: ServiceDatabase<'messaging'>, id: string) {
  return db.$transaction(
    async (tx) => {
      const message = await tx.message.findUnique({
        where: { id },
        select: { status: true, senderId: true, sequence: true, conversationId: true },
      });
      if (!message || message.status === 'DELETED') return [];
      const recipients = await tx.conversationMember.findMany({
        where: {
          conversationId: message.conversationId,
          userId: { not: message.senderId },
          status: 'ACTIVE',
          joinedSeq: { lte: message.sequence },
          lastReadSeq: { lt: message.sequence },
        },
        select: { userId: true },
      });
      return recipients.map(({ userId }) => userId);
    },
    { isolationLevel: 'RepeatableRead' },
  );
}
