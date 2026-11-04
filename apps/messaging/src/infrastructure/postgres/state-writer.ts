import type { MessagingData } from '../../../../../packages/contracts/src';

import type { Prisma } from '../../../../../generated/messaging/client';

import { canonical, assertUpdated } from '../../../../../packages/storage/src/values';
import {
  toConversation,
  toConversationMember,
  toMessage,
  toReaction,
  toMessageRevision,
} from './mapping';
export async function saveState(
  client: Prisma.TransactionClient,
  before: MessagingData,
  after: MessagingData,
): Promise<void> {
  {
    const previous = new Map((before.conversations ?? []).map((row) => [row.id, row]));

    for (const row of after.conversations ?? []) {
      const prior = previous.get(row.id);

      if (prior && canonical(prior) === canonical(row)) continue;

      const data = toConversation(row);

      if (!prior) await client.conversation.create({ data });
      else {
        const updated = await client.conversation.updateMany({
          where: { id: row.id, version: BigInt(prior.version) },
          data,
        });

        assertUpdated(updated.count);
      }
    }
  }
  {
    const previous = new Map(
      (before.conversationMembers ?? []).map((row) => [
        row.conversationId + ':' + row.userId,
        row,
      ]),
    );

    for (const row of after.conversationMembers ?? []) {
      const prior = previous.get(row.conversationId + ':' + row.userId);

      if (prior && canonical(prior) === canonical(row)) continue;

      const data = toConversationMember(row);

      if (!prior) await client.conversationMember.create({ data });
      else {
        const updated = await client.conversationMember.updateMany({
          where: { conversationId: row.conversationId, userId: row.userId },
          data,
        });

        assertUpdated(updated.count);
      }
    }
  }
  {
    const previous = new Map((before.messages ?? []).map((row) => [row.id, row]));

    for (const row of after.messages ?? []) {
      const prior = previous.get(row.id);

      if (prior && canonical(prior) === canonical(row)) continue;

      const data = toMessage(row);

      if (!prior) await client.message.create({ data });
      else {
        const updated = await client.message.updateMany({
          where: { id: row.id, version: BigInt(prior.version) },
          data,
        });

        assertUpdated(updated.count);
      }
    }
  }
  {
    const previous = new Map(
      (before.reactions ?? []).map((row) => [
        row.messageId + ':' + row.userId + ':' + row.emoji,
        row,
      ]),
    );

    for (const row of after.reactions ?? []) {
      const prior = previous.get(row.messageId + ':' + row.userId + ':' + row.emoji);

      if (prior && canonical(prior) === canonical(row)) continue;

      const data = toReaction(row);

      if (!prior) await client.reaction.create({ data });
      else {
        const updated = await client.reaction.updateMany({
          where: { messageId: row.messageId, userId: row.userId, emoji: row.emoji },
          data,
        });

        assertUpdated(updated.count);
      }
    }
  }
  {
    const previous = new Map((before.revisions ?? []).map((row) => [row.id, row]));

    for (const row of after.revisions ?? []) {
      const prior = previous.get(row.id);

      if (prior && canonical(prior) === canonical(row)) continue;

      const data = toMessageRevision(row);

      if (!prior) await client.messageRevision.create({ data });
      else {
        const updated = await client.messageRevision.updateMany({
          where: { id: row.id },
          data,
        });

        assertUpdated(updated.count);
      }
    }
  }

  for (const row of before.revisions ?? []) {
    if (!(after.revisions ?? []).some((item) => item.id === row.id))
      await client.messageRevision.deleteMany({ where: { id: row.id } });
  }

  for (const row of before.reactions ?? []) {
    if (
      !(after.reactions ?? []).some(
        (item) =>
          item.messageId === row.messageId &&
          item.userId === row.userId &&
          item.emoji === row.emoji,
      )
    )
      await client.reaction.deleteMany({
        where: { messageId: row.messageId, userId: row.userId, emoji: row.emoji },
      });
  }

  for (const row of before.messages ?? []) {
    if (!(after.messages ?? []).some((item) => item.id === row.id))
      await client.message.deleteMany({ where: { id: row.id } });
  }

  for (const row of before.conversationMembers ?? []) {
    if (
      !(after.conversationMembers ?? []).some(
        (item) =>
          item.conversationId === row.conversationId && item.userId === row.userId,
      )
    )
      await client.conversationMember.deleteMany({
        where: { conversationId: row.conversationId, userId: row.userId },
      });
  }

  for (const row of before.conversations ?? []) {
    if (!(after.conversations ?? []).some((item) => item.id === row.id))
      await client.conversation.deleteMany({ where: { id: row.id } });
  }
}
