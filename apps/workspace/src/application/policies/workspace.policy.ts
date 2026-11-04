import type {
  RequestContext,
  WorkspaceData,
} from '../../../../../packages/contracts/src';
import type { AccessClient } from '../../../../../packages/contracts/src/access';
import type { TransactionStore } from '../../../../../packages/contracts/src/commands';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { identifier } from '../../../../../packages/runtime/src/validation';
import type { WorkspaceReadRepository } from '../ports/read-repository';

export class WorkspacePolicy {
  constructor(
    public readonly store: TransactionStore<WorkspaceData> &
      Partial<WorkspaceReadRepository>,
    public readonly access: AccessClient,
  ) {}

  async authorize(op: string, input: Record<string, unknown>, context: RequestContext) {
    if (
      op === 'createWorkspace' &&
      !(await this.access.userExists(context.userId, context))
    )
      throw new DomainError('FORBIDDEN', 'Аккаунт недоступен');

    if (op === 'acceptInvitation') {
      const data = await this.store.load(),
        invitation = data.invitations?.find(
          (candidate) =>
            candidate.id === input.invitationId && candidate.userId === context.userId,
        );

      if (
        invitation &&
        (!data.workspaces.some(
          (workspaceId) =>
            workspaceId.id === invitation.workspaceId && workspaceId.status === 'ACTIVE',
        ) ||
          data.memberships.some(
            (m) =>
              m.workspaceId === invitation.workspaceId &&
              m.userId === context.userId &&
              m.status !== 'ACTIVE',
          ) ||
          !(await this.access.userExists(context.userId, context)))
      )
        throw new DomainError(
          'FORBIDDEN',
          'Пространство, членство или аккаунт заблокированы',
        );

      if (
        !(await this.store.load()).invitations?.some(
          (candidate) =>
            candidate.id === input.invitationId && candidate.userId === context.userId,
        )
      )
        throw new DomainError('NOT_FOUND', 'Приглашение не найдено');

      return;
    }

    if (op !== 'createWorkspace')
      this.manager(await this.store.load(), context, identifier(input.workspaceId));
  }

  manager(data: WorkspaceData, context: RequestContext, workspaceId: string) {
    if (
      !data.workspaces.some(
        (candidate) => candidate.id === workspaceId && candidate.status === 'ACTIVE',
      )
    )
      throw new DomainError('FORBIDDEN', 'Пространство заблокировано или отсутствует');

    const member = data.memberships.find(
      (m) =>
        m.workspaceId === workspaceId &&
        m.userId === context.userId &&
        m.status === 'ACTIVE',
    );

    const role = data.roles.find((r) => r.id === member?.roleId);

    if (!role || !['OWNER', 'ADMIN'].includes(role.code))
      throw new DomainError('FORBIDDEN', 'Нужна роль OWNER или ADMIN');

    return role;
  }

  async requireWorkspace(context: RequestContext, workspaceId: string, _write = false) {
    if (!(await this.access.workspaceIds(context)).includes(workspaceId))
      throw new DomainError('FORBIDDEN', 'Нет активного членства');
  }
}
