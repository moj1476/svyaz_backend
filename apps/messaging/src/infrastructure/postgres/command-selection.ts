import type { MessagingData } from '../../../../../packages/contracts/src';

import type { Prisma } from '../../../../../generated/messaging/client';

import { type CommandSelection } from '../../../../../packages/storage/src/transactional-repository';
import type { RequestContext } from '../../../../../packages/contracts/src';

import { loadState } from './state-loader';
import type { StateSelection } from './state-loader';
export async function selectCommandState(
  client: Prisma.TransactionClient,
  operation: string,
  input: Record<string, unknown>,
  _context: RequestContext,
): Promise<CommandSelection<MessagingData>> {
  if (operation === 'createConversation') {
    const conversations = {
      workspaceId: String(input.workspaceId),
      type: 'DIRECT',
      status: 'ACTIVE',
    };

    return {
      lock: 'messaging-workspace:' + String(input.workspaceId),
      load: () =>
        loadState(client, { conversations, conversationMembers: { conversations } }),
    };
  }

  const conversationId =
    typeof input.conversationId === 'string'
      ? input.conversationId
      : (
          await client.message.findUnique({
            where: { id: String(input.messageId) },
            select: { conversationId: true },
          })
        )?.conversationId;

  return {
    lock: 'conversation:' + String(conversationId ?? input.messageId),
    load: async () => {
      const selected: StateSelection = {
        conversations: { id: { in: conversationId ? [conversationId] : [] } },
        conversationMembers: {
          conversationId: { in: conversationId ? [conversationId] : [] },
        },
      };

      if (conversationId && (operation === 'sendMessage' || operation === 'markRead')) {
        const highest = await client.message.aggregate({
          where: { conversationId },
          _max: { sequence: true },
        });

        const last = highest._max.sequence;
        const matches: Prisma.MessageWhereInput[] =
          last === null ? [] : [{ sequence: last }];

        if (operation === 'sendMessage') {
          if (typeof input.threadRootId === 'string')
            matches.push({ id: input.threadRootId });

          if (typeof input.clientMessageId === 'string')
            matches.push({ clientMessageId: input.clientMessageId });
        } else matches.push({ sequence: BigInt(String(input.sequence)) });

        selected.messages = { conversationId, OR: matches };
      } else if (typeof input.messageId === 'string') {
        selected.messages = { id: input.messageId };
        selected.reactions = { messageId: input.messageId };
      }

      return loadState(client, selected);
    },
  };
}
