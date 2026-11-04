import type { MessagingData } from '../../../../../packages/contracts/src';

import type { Prisma } from '../../../../../generated/messaging/client';
import type { ReadScope } from '../../../../../packages/contracts/src/read-scope';

import {
  fromConversation,
  fromConversationMember,
  fromMessage,
  fromReaction,
  fromMessageRevision,
} from './mapping';
export interface StateSelection {
  conversations?: Prisma.ConversationWhereInput;
  conversationMembers?: Prisma.ConversationMemberWhereInput;
  messages?: Prisma.MessageWhereInput;
  reactions?: Prisma.ReactionWhereInput;
  revisions?: Prisma.MessageRevisionWhereInput;
}
export async function loadState(
  client: Prisma.TransactionClient,
  selected: StateSelection,
): Promise<MessagingData> {
  const conversations = selected.conversations
    ? (await client.conversation.findMany({ where: selected.conversations })).map(
        fromConversation,
      )
    : [];

  const conversationMembers = selected.conversationMembers
    ? (
        await client.conversationMember.findMany({
          where: selected.conversationMembers,
        })
      ).map(fromConversationMember)
    : [];

  const messages = selected.messages
    ? (await client.message.findMany({ where: selected.messages })).map(fromMessage)
    : [];

  const reactions = selected.reactions
    ? (await client.reaction.findMany({ where: selected.reactions })).map(fromReaction)
    : [];

  const revisions = selected.revisions
    ? (await client.messageRevision.findMany({ where: selected.revisions })).map(
        fromMessageRevision,
      )
    : [];

  return { conversations, conversationMembers, messages, reactions, revisions };
}

export async function loadReadState(
  client: Prisma.TransactionClient,
  scope: ReadScope,
): Promise<MessagingData> {
  const conversations: Prisma.ConversationWhereInput = scope.conversationIds
    ? { id: { in: [...scope.conversationIds] } }
    : {
        workspaceId: { in: [...(scope.workspaceIds ?? [])] },
        conversationMembers: {
          some: {
            userId: scope.actorId ?? '00000000-0000-0000-0000-000000000000',
            status: 'ACTIVE',
          },
        },
      };

  return loadState(client, {
    conversations,
    conversationMembers: { conversations },
    messages: { conversations },
    reactions: { messages: { conversations } },
    revisions: undefined,
  });
}
