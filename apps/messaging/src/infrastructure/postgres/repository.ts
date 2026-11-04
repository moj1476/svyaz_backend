import type { MessagingData } from '../../../../../packages/contracts/src';
import type { QueryInput } from '../../../../../packages/contracts/src/queries';

import type { Prisma } from '../../../../../generated/messaging/client';
import type { ReadScope } from '../../../../../packages/contracts/src/read-scope';
import { databaseFor, sqlExecutor } from '../../../../../packages/storage/src/prisma';
import {
  TransactionalRepository,
  type CommandSelection,
} from '../../../../../packages/storage/src/transactional-repository';
import type { RequestContext } from '../../../../../packages/contracts/src';

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
