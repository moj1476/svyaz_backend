import { events } from './domain/events';
import type { CallsData, RequestContext } from '../../../packages/contracts/src';
import type { AccessClient } from '../../../packages/contracts/src/access';
import type { TransactionStore } from '../../../packages/contracts/src/commands';
import { DomainError } from '../../../packages/contracts/src/errors';
import { identifier } from '../../../packages/runtime/src/validation';
import { ServiceBase } from '../../../packages/runtime/src/service-base';
import { ReadService } from './application';
import { endCall } from './application/end-call/handler';
import { joinCall } from './application/join-call/handler';
import { leaveCall } from './application/leave-call/handler';
import { startCall } from './application/start-call/handler';
import { CallsPolicy } from './application/policies/calls.policy';

export class BusinessService extends ServiceBase<'calls'> {
  private readonly policy: CallsPolicy;

  constructor(store: TransactionStore<CallsData>, access: AccessClient) {
    const policy = new CallsPolicy(store, access);

    super(
      'calls',
      store,
      access,
      new ReadService(store, access),
      {
        leaveCall: (input, context, data) => leaveCall(policy, input, context, data),
        startCall: (input, context, data) => startCall(policy, input, context, data),
        joinCall: (input, context, data) => joinCall(policy, input, context, data),
        endCall: (input, context, data) => endCall(policy, input, context, data),
      },
      events,
      policy.authorize.bind(policy),
    );
    this.policy = policy;
  }

  private requireWorkspace(context: RequestContext, workspaceId: string, write = false) {
    return this.policy.requireWorkspace(context, workspaceId, write);
  }

  async recordingUsesFile(fileId: string) {
    const id = identifier(fileId);
    const data = await this.store.load({ recordingFileIds: [id] });

    return data.recordings.some((recording) => recording.fileId === id);
  }

  async statistics(workspaceId: string, context: RequestContext) {
    await this.requireWorkspace(context, identifier(workspaceId));

    if (!(await this.access.permission(context, workspaceId, 'workspace.dashboard.read')))
      throw new DomainError('FORBIDDEN', 'Нет права сводки');

    if (this.store.aggregate) return this.store.aggregate(workspaceId);

    const data = await this.store.load({
        workspaceIds: [workspaceId],
        actorId: context.userId,
      }),
      now = Date.now(),
      since = now - 30 * 86400000;

    return {
      callsLast30Days: String(
        data.calls.filter(
          (call) =>
            call.workspaceId === workspaceId &&
            call.startedAt &&
            Date.parse(call.startedAt) >= since &&
            Date.parse(call.startedAt) <= now,
        ).length,
      ),
    };
  }
}
