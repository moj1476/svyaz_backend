import type { RequestContext, WorkspaceData } from '#contracts';
import type { CommandInput, CommandOutput } from '#contracts/command-map';
import { DomainError } from '#contracts/errors';
import { bool, identifier } from '#runtime/validation';
import type { WorkspacePolicy } from '../policies/workspace.policy';

export async function assignTeamMember(
  domain: WorkspacePolicy,
  input: CommandInput<'assignTeamMember'>,
  context: RequestContext,
  data: WorkspaceData,
): Promise<CommandOutput<'assignTeamMember'>> {
  const workspaceId = identifier(input.workspaceId);

  domain.manager(data, context, workspaceId);

  const team = data.teams.find(
      (t) => t.id === identifier(input.teamId) && t.workspaceId === workspaceId,
    ),
    member = data.memberships.find(
      (m) =>
        m.id === identifier(input.membershipId) &&
        m.workspaceId === workspaceId &&
        m.status === 'ACTIVE',
    );

  if (!team || !member)
    throw new DomainError('NOT_FOUND', 'Команда или участник не найдены');

  team.membershipIds = team.membershipIds.filter((id) => id !== member.id);

  if (bool(input.active)) team.membershipIds.push(member.id);

  return { team };
}
