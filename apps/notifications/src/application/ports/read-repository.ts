import type { QueryInput, QueryOutput } from '#contracts/queries';

export interface NotificationsReadRepository {
  listNotifications(
    input: QueryInput<'notifications'>,
    userId: string,
    workspaceIds: string[],
  ): Promise<QueryOutput<'notifications'>>;
}
