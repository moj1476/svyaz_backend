import { events } from './domain/events';
import type { FilesData, RequestContext } from '#contracts';
import type { AccessClient } from '#contracts/access';
import type { TransactionStore } from '#contracts/commands';
import { DomainError } from '#contracts/errors';
import { identifier } from '#runtime/validation';
import { ServiceBase } from '#runtime/service-base';
import { ReadService } from './application';
import { deleteFile } from './application/delete-file/handler';
import { FilesPolicy } from './application/policies/files.policy';

export class BusinessService extends ServiceBase<'files'> {
  private readonly policy: FilesPolicy;

  constructor(store: TransactionStore<FilesData>, access: AccessClient) {
    const policy = new FilesPolicy(store, access);

    super(
      'files',
      store,
      access,
      new ReadService(store, access),
      {
        deleteFile: (input, context, data) => deleteFile(policy, input, context, data),
      },
      events,
      policy.authorize.bind(policy),
    );
    this.policy = policy;
  }

  private requireWorkspace(context: RequestContext, workspaceId: string, write = false) {
    return this.policy.requireWorkspace(context, workspaceId, write);
  }

  async statistics(workspaceId: string, context: RequestContext) {
    await this.requireWorkspace(context, identifier(workspaceId));

    if (!(await this.access.permission(context, workspaceId, 'workspace.dashboard.read')))
      throw new DomainError('FORBIDDEN', 'Нет права сводки');

    if (this.store.aggregate) return this.store.aggregate(workspaceId);

    const data = await this.store.load({
      workspaceIds: [workspaceId],
      actorId: context.userId,
    });

    return {
      storageUsed: data.files
        .filter((f) => f.workspaceId === workspaceId && f.status !== 'DELETED')
        .reduce((sum, f) => sum + BigInt(f.sizeBytes), 0n)
        .toString(),
      storageLimit: null,
    };
  }
}
