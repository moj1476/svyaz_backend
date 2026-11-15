import type { WorkspaceData } from '#contracts';
import type { QueryInput } from '#contracts/queries';

import type { Prisma } from '#generated/workspace/client';
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
import { listMembers } from './queries/members';
import { aggregate } from './queries/statistics';
import { workspaceVisible } from './queries/workspace-access';
export class Repository extends TransactionalRepository<
  WorkspaceData,
  Prisma.TransactionClient
> {
  readonly db = databaseFor('workspace');
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
  ): Promise<CommandSelection<WorkspaceData>> {
    return selectCommandState(client, operation, input, context);
  }
  protected save(
    client: Prisma.TransactionClient,
    before: WorkspaceData,
    after: WorkspaceData,
  ) {
    return saveState(client, before, after);
  }
  listMembers(input: QueryInput<'members'>, userId: string) {
    return listMembers(this.sql, input, userId);
  }
  aggregate(workspaceId: string) {
    return aggregate(this.db, workspaceId);
  }
  workspaceVisible(workspaceId: string, userId: string) {
    return workspaceVisible(this.db, workspaceId, userId);
  }
}
