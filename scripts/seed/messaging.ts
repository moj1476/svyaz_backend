import { databaseFor } from '../../packages/storage/src/prisma';
import { labData } from '../../packages/lab-data/src';

import {
  toConversation,
  toConversationMember,
  toMessage,
  toReaction,
  toMessageRevision,
} from '../../apps/messaging/src/infrastructure/postgres/mapping';

export async function seedMessaging(): Promise<void> {
  const db = databaseFor('messaging');
  try {
    await db.$transaction(async (client) => {
      await client.conversation.createMany({
        data: (labData.messaging.conversations ?? []).map(toConversation),
        skipDuplicates: true,
      });
      await client.conversationMember.createMany({
        data: (labData.messaging.conversationMembers ?? []).map(toConversationMember),
        skipDuplicates: true,
      });
      await client.message.createMany({
        data: (labData.messaging.messages ?? []).map(toMessage),
        skipDuplicates: true,
      });
      await client.reaction.createMany({
        data: (labData.messaging.reactions ?? []).map(toReaction),
        skipDuplicates: true,
      });
      await client.messageRevision.createMany({
        data: (labData.messaging.revisions ?? []).map(toMessageRevision),
        skipDuplicates: true,
      });
    });
  } finally {
    await db.$disconnect();
  }
}
