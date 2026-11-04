import type {
  QueryInput,
  QueryOutput,
} from '../../../../../packages/contracts/src/queries';

export interface WorkspaceReadRepository {
  workspaceVisible(workspaceId: string, userId: string): Promise<boolean>;
  listMembers(
    input: QueryInput<'members'>,
    userId: string,
  ): Promise<QueryOutput<'members'>>;
}
