import type { Conversation, Message } from '../../../../../../packages/contracts/src';

import { fromConversation, fromMessage } from '../mapping';
import type { ServiceDatabase } from '../../../../../../packages/storage/src/prisma';
export async function getConversationForUser(
  db: ServiceDatabase<'messaging'>,
  conversationId: string,
  userId: string,
): Promise<Conversation | null> {
  const row = await db.conversation.findFirst({
    where: {
      id: conversationId,
      conversationMembers: { some: { userId: userId, status: 'ACTIVE' } },
    },
  });

  return row ? fromConversation(row) : null;
}
export async function getRootMessage(
  db: ServiceDatabase<'messaging'>,
  messageId: string,
): Promise<Message | null> {
  const row = await db.message.findFirst({
    where: { id: messageId, threadRootId: null },
  });

  return row ? fromMessage(row) : null;
}
