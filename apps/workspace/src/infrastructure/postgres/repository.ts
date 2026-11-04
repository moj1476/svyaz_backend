import type { WorkspaceData } from '../../../../../packages/contracts/src';
import type { QueryInput } from '../../../../../packages/contracts/src/queries';

import type { Prisma } from '../../../../../generated/workspace/client';
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
