import { assertOwnerTransition } from '../../domain/membership';
import type { RequestContext, WorkspaceData } from '#contracts';
import type { CommandInput, CommandOutput } from '#contracts/command-map';
import { DomainError } from '#contracts/errors';
import { identifier } from '#runtime/validation';
import { version } from '#runtime/version';
import type { WorkspacePolicy } from '../policies/workspace.policy';

export async function deactivateMember(
  domain: WorkspacePolicy,
  input: CommandInput<'deactivateMember'>,
  context: RequestContext,
  data: WorkspaceData,
): Promise<CommandOutput<'deactivateMember'>> {
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

  assertOwnerTransition(
    actorRole.code,
    current.code,
    null,
    data.memberships.filter(
      (member) =>
        member.id !== input.membershipId &&
        member.workspaceId === workspaceId &&
        member.status === 'ACTIVE' &&
        data.roles.some((role) => role.id === member.roleId && role.code === 'OWNER'),
    ).length,
  );
  version(member, input.expectedVersion);
  member.status = 'SUSPENDED';

  return { membership: member };
}
