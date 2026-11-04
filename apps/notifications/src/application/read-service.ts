import type {
  NotificationsData,
  ReadRepository,
  RequestContext,
  ServiceClient,
} from '../../../../packages/contracts/src';
import type { AccessClient } from '../../../../packages/contracts/src/access';

export class ReadService implements ServiceClient<'notifications'> {
  constructor(
    private readonly repository: ReadRepository<NotificationsData>,
    private readonly access: AccessClient,
  ) {}

  async snapshot(context: RequestContext): Promise<NotificationsData> {
    const access = this.access;
    const workspaces = new Set(await access.workspaceIds(context));
    const data = await this.repository.load({
      actorId: context.userId,
      workspaceIds: [...workspaces],
    });

    return {
      notifications: data.notifications.filter(
        (n) => n.recipientId === context.userId && workspaces.has(n.workspaceId),
      ),
    };
  }
}
