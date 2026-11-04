import type { WorkspaceData } from '../../../../../packages/contracts/src';

import type { Prisma } from '../../../../../generated/workspace/client';
import type { ReadScope } from '../../../../../packages/contracts/src/read-scope';

import {
  fromWorkspace,
  fromRole,
  fromPermission,
  fromMembership,
  fromTeam,
  fromSecurityPolicy,
  fromInvitation,
} from './mapping';
export interface StateSelection {
  workspaces?: Prisma.WorkspaceWhereInput;
  roles?: Prisma.RoleWhereInput;
  permissions?: Prisma.PermissionWhereInput;
  memberships?: Prisma.MembershipWhereInput;
  teams?: Prisma.TeamWhereInput;
  policies?: Prisma.SecurityPolicyWhereInput;
  invitations?: Prisma.InvitationWhereInput;
}
export async function loadState(
  client: Prisma.TransactionClient,
  selected: StateSelection,
): Promise<WorkspaceData> {
  const workspaces = selected.workspaces
    ? (await client.workspace.findMany({ where: selected.workspaces })).map(fromWorkspace)
    : [];

  const roles = selected.roles
    ? (
        await client.role.findMany({
          where: selected.roles,
          include: { rolePermissions: true },
        })
      ).map(fromRole)
    : [];

  const permissions = selected.permissions
    ? (await client.permission.findMany({ where: selected.permissions })).map(
        fromPermission,
      )
    : [];

  const memberships = selected.memberships
    ? (await client.membership.findMany({ where: selected.memberships })).map(
        fromMembership,
      )
    : [];

  const teams = selected.teams
    ? (
        await client.team.findMany({
          where: selected.teams,
          include: { teamMembers: true },
        })
      ).map(fromTeam)
    : [];

  const policies = selected.policies
    ? (await client.securityPolicy.findMany({ where: selected.policies })).map(
        fromSecurityPolicy,
      )
    : [];

  const invitations = selected.invitations
    ? (await client.invitation.findMany({ where: selected.invitations })).map(
        fromInvitation,
      )
    : [];

  return { workspaces, roles, permissions, memberships, teams, policies, invitations };
}
export async function loadWorkspaceState(
  client: Prisma.TransactionClient,
  ids: string[],
) {
  const workspaceId = { in: ids };

  return loadState(client, {
    workspaces: { id: workspaceId },
    memberships: { workspaceId },
    roles: { workspaceId },
    teams: { workspaceId },
    policies: { workspaceId },
    invitations: { workspaceId },
    permissions: {},
  });
}
export async function loadReadState(
  client: Prisma.TransactionClient,
  scope: ReadScope,
): Promise<WorkspaceData> {
  const ids = scope.workspaceIds
    ? [...scope.workspaceIds]
    : (
        await client.membership.findMany({
          where: {
            userId: scope.actorId ?? '00000000-0000-0000-0000-000000000000',
            status: 'ACTIVE',
          },
          select: { workspaceId: true },
        })
      ).map((row) => row.workspaceId);

  return loadWorkspaceState(client, ids);
}
