import type { FilesData, RequestContext } from '../../../../../packages/contracts/src';
import type { AccessClient } from '../../../../../packages/contracts/src/access';
import type { TransactionStore } from '../../../../../packages/contracts/src/commands';
import { DomainError } from '../../../../../packages/contracts/src/errors';

export class FilesPolicy {
  constructor(
    public readonly store: TransactionStore<FilesData>,
    public readonly access: AccessClient,
  ) {}

  async authorize(_op: string, input: Record<string, unknown>, context: RequestContext) {
    const f = (await this.store.load()).files.find((f) => f.id === input.fileId);

    if (!f) throw new DomainError('NOT_FOUND', 'Файл не найден');

    await this.requireWorkspace(context, f.workspaceId, true);

    if (
      f.ownerId !== context.userId &&
      !(await this.access.permission(context, f.workspaceId, 'workspace.manage'))
    )
      throw new DomainError('FORBIDDEN', 'Нет права удаления');
  }

  async requireWorkspace(context: RequestContext, workspaceId: string, write = false) {
    if (!(await this.access.workspaceIds(context)).includes(workspaceId))
      throw new DomainError('FORBIDDEN', 'Нет активного членства');

    if (write && !(await this.access.permission(context, workspaceId, 'files.delete')))
      throw new DomainError('FORBIDDEN', 'Нет права изменения ресурса');
  }
}
