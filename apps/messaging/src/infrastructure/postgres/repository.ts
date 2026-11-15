import type { MessagingData } from '#contracts';
import type { QueryInput } from '#contracts/queries';

import type { Prisma } from '#generated/messaging/client';
import type { ReadScope } from '#contracts/read-scope';
import { databaseFor, sqlExecutor } from '#storage/prisma';
import {
  TransactionalRepository,
  type CommandSelection,
} from '#storage/transactional-repository';
import type { RequestContext } from '#contracts';

import { loadReadState } from './state-loader';
import { selectCommandState } from './command-selection';
import { saveState } from './state-writer';
import { listMessages } from './queries/messages';
import { listConversations } from './queries/conversations';
import { aggregate, conversationStats } from './queries/statistics';
import { getConversationForUser, getRootMessage } from './queries/conversation-access';
export class Repository extends TransactionalRepository<
  MessagingData,
  Prisma.TransactionClient
> {
  readonly db = databaseFor('messaging');
  private readonly sql = sqlExecutor(this.db);
  protected transaction<R>(
    work: (client: Prisma.TransactionClient) => Promise<R>,
    repeatableRead = false,
  ): Promise<R> {
    return this.db.$transaction(work, {
      isolationLevel: repeatableRead ? 'RepeatableRead' : 'ReadCommitted',
    });
  }
  close() {
    return this.db.$disconnect();
  }
  protected read(client: Prisma.TransactionClient, scope: ReadScope) {
    return loadReadState(client, scope);
  }
  protected command(
    client: Prisma.TransactionClient,
    operation: string,
    input: Record<string, unknown>,
    context: RequestContext,
  ): Promise<CommandSelection<MessagingData>> {
    return selectCommandState(client, operation, input, context);
  }
  protected save(
    client: Prisma.TransactionClient,
    before: MessagingData,
    after: MessagingData,
  ) {
    return saveState(client, before, after);
  }
  listMessages(
    input: QueryInput<'messages'> | QueryInput<'thread'>,
    conversationId: string,
    rootId: string | null,
    userId: string,
  ) {
    return listMessages(this.sql, input, conversationId, rootId, userId);
  }
  listConversations(input: QueryInput<'conversations'>, userId: string) {
    return listConversations(this.sql, input, userId);
  }
  aggregate(workspaceId: string) {
    return aggregate(this.db, workspaceId);
  }
  conversationStats(conversationId: string, userId: string) {
    return conversationStats(this.db, conversationId, userId);
  }
  getConversationForUser(conversationId: string, userId: string) {
    return getConversationForUser(this.db, conversationId, userId);
  }
  getRootMessage(messageId: string) {
    return getRootMessage(this.db, messageId);
  }
}
