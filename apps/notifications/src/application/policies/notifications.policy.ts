import type {
  NotificationsData,
  RequestContext,
} from '../../../../../packages/contracts/src';
import type { AccessClient } from '../../../../../packages/contracts/src/access';
import type { TransactionStore } from '../../../../../packages/contracts/src/commands';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import type { NotificationsReadRepository } from '../ports/read-repository';

export class NotificationsPolicy {
  constructor(
    public readonly store: TransactionStore<NotificationsData> &
      Partial<NotificationsReadRepository>,
    public readonly access: AccessClient,
  ) {}

  async authorize(_op: string, input: Record<string, unknown>, context: RequestContext) {
    const n = (await this.store.load()).notifications.find(
      (n) => n.id === input.id && n.recipientId === context.userId,
    );

    if (!n) throw new DomainError('NOT_FOUND', 'Уведомление не найдено');

    await this.requireWorkspace(context, n.workspaceId);
  }

  async requireWorkspace(context: RequestContext, workspaceId: string, _write = false) {
    if (!(await this.access.workspaceIds(context)).includes(workspaceId))
      throw new DomainError('FORBIDDEN', 'Нет активного членства');
  }
}
