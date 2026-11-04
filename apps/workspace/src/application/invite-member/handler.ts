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
import { dateTime } from '../../../../../packages/contracts/src/validation';
import { identifier } from '../../../../../packages/runtime/src/validation';
import type { WorkspacePolicy } from '../policies/workspace.policy';

export async function inviteMember(
  domain: WorkspacePolicy,
  input: CommandInput<'inviteMember'>,
  context: RequestContext,
  data: WorkspaceData,
): Promise<CommandOutput<'inviteMember'>> {
  const workspaceId = identifier(input.workspaceId);
  const actorRole = domain.manager(data, context, workspaceId);
  const userId = identifier(input.userId),
    role = data.roles.find(
      (r) => r.id === identifier(input.roleId) && r.workspaceId === workspaceId,
    );

  if (!role || !(await domain.access.userExists(userId, context)))
    throw new DomainError('VALIDATION', 'Пользователь или роль отсутствуют');

  if (role.code === 'OWNER' && actorRole.code !== 'OWNER')
    throw new DomainError('FORBIDDEN', 'Только владелец назначает OWNER');

  const expiresAt = dateTime(input.expiresAt, 'expiresAt');

  if (
    !Number.isFinite(Date.parse(expiresAt)) ||
    Date.parse(expiresAt) <= Date.now() ||
    Date.parse(expiresAt) > Date.now() + 30 * 86400000
  )
    throw new DomainError(
      'VALIDATION',
      'Срок приглашения должен быть в пределах 30 дней',
    );

  if (data.memberships.some((m) => m.workspaceId === workspaceId && m.userId === userId))
    throw new DomainError('CONFLICT', 'Членство уже существует');

  data.invitations ??= [];

  if (
    data.invitations.some(
      (conversation) =>
        conversation.workspaceId === workspaceId &&
        conversation.userId === userId &&
        conversation.status === 'PENDING' &&
        Date.parse(conversation.expiresAt) > Date.now(),
    )
  )
    throw new DomainError('CONFLICT', 'Уже есть действующее приглашение');

  for (const conversation of data.invitations)
    if (
      conversation.workspaceId === workspaceId &&
      conversation.userId === userId &&
      conversation.status === 'PENDING'
    )
      conversation.status = 'EXPIRED';

  const invitation = {
    id: randomUUID(),
    workspaceId: workspaceId,
    userId,
    roleId: role.id,
    status: 'PENDING' as const,
    expiresAt: new Date(expiresAt).toISOString(),
    createdAt: new Date().toISOString(),
  };

  data.invitations.push(invitation);

  return { invitation };
}
