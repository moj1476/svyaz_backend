import { randomUUID } from 'node:crypto';
import type {
  RequestContext,
  WorkspaceData,
} from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { identifier } from '../../../../../packages/runtime/src/validation';
import type { WorkspacePolicy } from '../policies/workspace.policy';

export async function acceptInvitation(
  domain: WorkspacePolicy,
  input: CommandInput<'acceptInvitation'>,
  context: RequestContext,
  data: WorkspaceData,
): Promise<CommandOutput<'acceptInvitation'>> {
  const invitation = data.invitations?.find(
    (conversation) =>
      conversation.id === identifier(input.invitationId) &&
      conversation.userId === context.userId,
  );

  if (!invitation) throw new DomainError('NOT_FOUND', 'Приглашение не найдено');

  if (
    !data.workspaces.some(
      (workspaceId) =>
        workspaceId.id === invitation.workspaceId && workspaceId.status === 'ACTIVE',
    ) ||
    !(await domain.access.userExists(context.userId, context))
  )
    throw new DomainError('FORBIDDEN', 'Пространство или аккаунт заблокированы');

  if (invitation.status !== 'PENDING' || Date.parse(invitation.expiresAt) <= Date.now())
    throw new DomainError('INVALID_STATE', 'Приглашение принято или истекло');

  if (
    data.memberships.some(
      (m) => m.workspaceId === invitation.workspaceId && m.userId === context.userId,
    )
  )
    throw new DomainError(
      'CONFLICT',
      'Членство уже существует; нужна отдельная операция администратора',
    );

  const membership = {
    id: randomUUID(),
    workspaceId: invitation.workspaceId,
    userId: context.userId,
    roleId: invitation.roleId,
    status: 'ACTIVE' as const,
    joinedAt: new Date().toISOString(),
    version: '1',
  };

  data.memberships.push(membership);
  invitation.status = 'ACCEPTED';

  return { membership };
}
