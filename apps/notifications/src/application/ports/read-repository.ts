import type {
  QueryInput,
  QueryOutput,
} from '../../../../../packages/contracts/src/queries';

export interface NotificationsReadRepository {
  listNotifications(
    input: QueryInput<'notifications'>,
    userId: string,
    workspaceIds: string[],
  ): Promise<QueryOutput<'notifications'>>;
}
