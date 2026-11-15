import type { QueryInput, QueryOutput } from '#contracts/queries';

export interface WorkspaceReadRepository {
  workspaceVisible(workspaceId: string, userId: string): Promise<boolean>;
  listMembers(
    input: QueryInput<'members'>,
    userId: string,
  ): Promise<QueryOutput<'members'>>;
}
