import { events } from './domain/events';
import type { NotificationsData, RequestContext } from '#contracts';
import type { AccessClient } from '#contracts/access';
import type { TransactionStore } from '#contracts/commands';
import { queryDispatcher } from '#runtime/query-dispatch';
import { ServiceBase } from '#runtime/service-base';
import { ReadService } from './application';
import { markNotificationRead } from './application/mark-notification-read/handler';
import { notifications } from './application/notifications/query';
import { NotificationsPolicy } from './application/policies/notifications.policy';

export class BusinessService extends ServiceBase<'notifications'> {
  private readonly policy: NotificationsPolicy;

  constructor(store: TransactionStore<NotificationsData>, access: AccessClient) {
    const policy = new NotificationsPolicy(store, access);

    super(
      'notifications',
      store,
      access,
      new ReadService(store, access),
      {
        markNotificationRead: (input, context, data) =>
          markNotificationRead(policy, input, context, data),
      },
      events,
      policy.authorize.bind(policy),
    );
    this.policy = policy;
  }

  private requireWorkspace(context: RequestContext, workspaceId: string, write = false) {
    return this.policy.requireWorkspace(context, workspaceId, write);
  }

  query = queryDispatcher({
    notifications: (input, context) =>
      notifications(
        this.policy,
        input,
        context,
        this.snapshot.bind(this),
        this.requireWorkspace.bind(this),
      ),
  });
}
