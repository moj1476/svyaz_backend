import type { CallsData, RequestContext } from '../../../../../packages/contracts/src';
import type { AccessClient } from '../../../../../packages/contracts/src/access';
import type { TransactionStore } from '../../../../../packages/contracts/src/commands';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { identifier } from '../../../../../packages/runtime/src/validation';

export class CallsPolicy {
  constructor(
    public readonly store: TransactionStore<CallsData>,
    public readonly access: AccessClient,
  ) {}

  async authorize(op: string, input: Record<string, unknown>, context: RequestContext) {
    if (op === 'leaveCall') {
      const id = identifier(input.callId),
        data = await this.store.load();

      if (
        !data.calls.some((call) => call.id === id) ||
        !data.participants.some((p) => p.callId === id && p.userId === context.userId)
      )
        throw new DomainError('NOT_FOUND', 'Участие в звонке не найдено');

      return;
    }

    const data = await this.store.load(),
      id =
        op === 'startCall'
          ? identifier(input.conversationId)
          : data.calls.find((call) => call.id === input.callId)?.conversationId;

    if (!id || !(await this.access.conversationIds(context)).includes(id))
      throw new DomainError('NOT_FOUND', 'Звонок недоступен');

    await this.requireWorkspace(
      context,
      await this.access.conversationWorkspace(context, id),
      true,
    );
  }

  async requireWorkspace(context: RequestContext, workspaceId: string, write = false) {
    if (!(await this.access.workspaceIds(context)).includes(workspaceId))
      throw new DomainError('FORBIDDEN', 'Нет активного членства');

    if (write && !(await this.access.permission(context, workspaceId, 'calls.write')))
      throw new DomainError('FORBIDDEN', 'Нет права изменения ресурса');
  }
}
