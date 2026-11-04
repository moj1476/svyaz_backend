import { events } from './domain/events';
import type { NotificationsData, RequestContext } from '../../../packages/contracts/src';
import type { AccessClient } from '../../../packages/contracts/src/access';
import type { TransactionStore } from '../../../packages/contracts/src/commands';
import { queryDispatcher } from '../../../packages/runtime/src/query-dispatch';
import { ServiceBase } from '../../../packages/runtime/src/service-base';
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
