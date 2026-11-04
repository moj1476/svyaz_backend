import { event } from '../../../../packages/contracts/src/events';
import type { CommandEvents } from '../../../../packages/contracts/src/events';

export const events: CommandEvents<'workspace'> = {
  createWorkspace: (_input, output, context) => [
    event(
      'workspace.created.v1',
      'workspace',
      output.workspace.id,
      output.workspace.id,
      context,
    ),
  ],
  inviteMember: (_input, output, context) => [
    event(
      'workspace.invitation_created.v1',
      'invitation',
      output.invitation.id,
      output.invitation.workspaceId,
      context,
    ),
  ],
  acceptInvitation: (_input, output, context) => [
    event(
      'workspace.member_added.v1',
      'membership',
      output.membership.id,
      output.membership.workspaceId,
      context,
    ),
  ],
  createTeam: (_input, output, context) => [
    event(
      'workspace.team_created.v1',
      'team',
      output.team.id,
      output.team.workspaceId,
      context,
    ),
  ],
  assignTeamMember: (_input, output, context) => [
    event(
      'workspace.team_members_changed.v1',
      'team',
      output.team.id,
      output.team.workspaceId,
      context,
    ),
  ],
  changeMemberRole: (_input, output, context) => [
    event(
      'workspace.member_role_changed.v1',
      'membership',
      output.membership.id,
      output.membership.workspaceId,
      context,
    ),
  ],
  deactivateMember: (_input, output, context) => [
    event(
      'workspace.member_removed.v1',
      'membership',
      output.membership.id,
      output.membership.workspaceId,
      context,
    ),
  ],
  updateWorkspacePolicy: (_input, output, context) => [
    event(
      'workspace.policy_updated.v1',
      'policy',
      output.policy.workspaceId,
      output.policy.workspaceId,
      context,
    ),
  ],
};
