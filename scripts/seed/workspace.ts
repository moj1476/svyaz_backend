import { databaseFor } from '../../packages/storage/src/prisma';
import { labData } from '../../packages/lab-data/src';

import {
  toWorkspace,
  toRole,
  toPermission,
  toMembership,
  toTeam,
  toSecurityPolicy,
  toInvitation,
} from '../../apps/workspace/src/infrastructure/postgres/mapping';

export async function seedWorkspace(): Promise<void> {
  const db = databaseFor('workspace');
  try {
    await db.$transaction(async (client) => {
      await client.workspace.createMany({
        data: (labData.workspace.workspaces ?? []).map(toWorkspace),
        skipDuplicates: true,
      });
      await client.role.createMany({
        data: (labData.workspace.roles ?? []).map(toRole),
        skipDuplicates: true,
      });
      await client.permission.createMany({
        data: (labData.workspace.permissions ?? []).map(toPermission),
        skipDuplicates: true,
      });
      await client.membership.createMany({
        data: (labData.workspace.memberships ?? []).map(toMembership),
        skipDuplicates: true,
      });
      await client.team.createMany({
        data: (labData.workspace.teams ?? []).map(toTeam),
        skipDuplicates: true,
      });
      await client.securityPolicy.createMany({
        data: (labData.workspace.policies ?? []).map(toSecurityPolicy),
        skipDuplicates: true,
      });
      await client.invitation.createMany({
        data: (labData.workspace.invitations ?? []).map(toInvitation),
        skipDuplicates: true,
      });

      for (const role of labData.workspace.roles) {
        await client.rolePermission.createMany({
          data: role.permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }

      for (const team of labData.workspace.teams) {
        await client.teamMember.createMany({
          data: team.membershipIds.map((membershipId) => ({
            teamId: team.id,
            membershipId,
          })),
          skipDuplicates: true,
        });
      }
    });
  } finally {
    await db.$disconnect();
  }
}
