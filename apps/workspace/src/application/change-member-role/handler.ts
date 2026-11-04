import { assertOwnerTransition } from '../../domain/membership';
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
import { version } from '../../../../../packages/runtime/src/version';
import type { WorkspacePolicy } from '../policies/workspace.policy';

export async function changeMemberRole(
  domain: WorkspacePolicy,
  input: CommandInput<'changeMemberRole'>,
  context: RequestContext,
  data: WorkspaceData,
): Promise<CommandOutput<'changeMemberRole'>> {
  const workspaceId = identifier(input.workspaceId);
  const actorRole = domain.manager(data, context, workspaceId);
  const member = data.memberships.find(
    (m) =>
      m.id === identifier(input.membershipId) &&
      m.workspaceId === workspaceId &&
      m.status === 'ACTIVE',
  );

  if (!member) throw new DomainError('NOT_FOUND', 'Членство не найдено');

  const current = data.roles.find((r) => r.id === member.roleId)!;
  const role = data.roles.find(
    (r) => r.id === identifier(input.roleId) && r.workspaceId === workspaceId,
  );

  if (!role)
    throw new DomainError('VALIDATION', 'Роль из другого пространства или отсутствует');

  assertOwnerTransition(
    actorRole.code,
    current.code,
    role.code,
    data.memberships.filter(
      (member) =>
        member.id !== input.membershipId &&
        member.workspaceId === workspaceId &&
        member.status === 'ACTIVE' &&
        data.roles.some((role) => role.id === member.roleId && role.code === 'OWNER'),
    ).length,
  );
  version(member, input.expectedVersion);
  member.roleId = role.id;

  return { membership: member };
}
