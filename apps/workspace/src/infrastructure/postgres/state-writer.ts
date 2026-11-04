import type { WorkspaceData } from '../../../../../packages/contracts/src';

import type { Prisma } from '../../../../../generated/workspace/client';

import { canonical, assertUpdated } from '../../../../../packages/storage/src/values';
import {
  toWorkspace,
  toRole,
  toPermission,
  toMembership,
  toTeam,
  toSecurityPolicy,
  toInvitation,
} from './mapping';
export async function saveState(
  client: Prisma.TransactionClient,
  before: WorkspaceData,
  after: WorkspaceData,
): Promise<void> {
  {
    const previous = new Map((before.workspaces ?? []).map((row) => [row.id, row]));

    for (const row of after.workspaces ?? []) {
      const prior = previous.get(row.id);

      if (prior && canonical(prior) === canonical(row)) continue;

      const data = toWorkspace(row);

      if (!prior) await client.workspace.create({ data });
      else {
        const updated = await client.workspace.updateMany({
          where: { id: row.id, version: BigInt(prior.version) },
          data,
        });

        assertUpdated(updated.count);
      }
    }
  }
  {
    const previous = new Map((before.roles ?? []).map((row) => [row.id, row]));

    for (const row of after.roles ?? []) {
      const prior = previous.get(row.id);

      if (prior && canonical(prior) === canonical(row)) continue;

      const data = toRole(row);

      if (!prior) await client.role.create({ data });
      else {
        const updated = await client.role.updateMany({
          where: { id: row.id, version: BigInt(prior.version) },
          data,
        });

        assertUpdated(updated.count);
      }

      await client.rolePermission.deleteMany({
        where: { roleId: row.id, permissionId: { notIn: row.permissionIds } },
      });

      if (row.permissionIds.length)
        await client.rolePermission.createMany({
          data: row.permissionIds.map((id) => ({ roleId: row.id, permissionId: id })),
          skipDuplicates: true,
        });
    }
  }
  {
    const previous = new Map((before.permissions ?? []).map((row) => [row.id, row]));

    for (const row of after.permissions ?? []) {
      const prior = previous.get(row.id);

      if (prior && canonical(prior) === canonical(row)) continue;

      const data = toPermission(row);

      if (!prior) await client.permission.create({ data });
      else {
        const updated = await client.permission.updateMany({
          where: { id: row.id },
          data,
        });

        assertUpdated(updated.count);
      }
    }
  }
  {
    const previous = new Map((before.memberships ?? []).map((row) => [row.id, row]));

    for (const row of after.memberships ?? []) {
      const prior = previous.get(row.id);

      if (prior && canonical(prior) === canonical(row)) continue;

      const data = toMembership(row);

      if (!prior) await client.membership.create({ data });
      else {
        const updated = await client.membership.updateMany({
          where: { id: row.id, version: BigInt(prior.version) },
          data,
        });

        assertUpdated(updated.count);
      }
    }
  }
  {
    const previous = new Map((before.teams ?? []).map((row) => [row.id, row]));

    for (const row of after.teams ?? []) {
      const prior = previous.get(row.id);

      if (prior && canonical(prior) === canonical(row)) continue;

      const data = toTeam(row);

      if (!prior) await client.team.create({ data });
      else {
        const updated = await client.team.updateMany({ where: { id: row.id }, data });

        assertUpdated(updated.count);
      }

      await client.teamMember.deleteMany({
        where: { teamId: row.id, membershipId: { notIn: row.membershipIds } },
      });

      if (row.membershipIds.length)
        await client.teamMember.createMany({
          data: row.membershipIds.map((id) => ({ teamId: row.id, membershipId: id })),
          skipDuplicates: true,
        });
    }
  }
  {
    const previous = new Map(
      (before.policies ?? []).map((row) => [row.workspaceId, row]),
    );

    for (const row of after.policies ?? []) {
      const prior = previous.get(row.workspaceId);

      if (prior && canonical(prior) === canonical(row)) continue;

      const data = toSecurityPolicy(row);

      if (!prior) await client.securityPolicy.create({ data });
      else {
        const updated = await client.securityPolicy.updateMany({
          where: { workspaceId: row.workspaceId, version: BigInt(prior.version) },
          data,
        });

        assertUpdated(updated.count);
      }
    }
  }
  {
    const previous = new Map((before.invitations ?? []).map((row) => [row.id, row]));

    for (const row of after.invitations ?? []) {
      const prior = previous.get(row.id);

      if (prior && canonical(prior) === canonical(row)) continue;

      const data = toInvitation(row);

      if (!prior) await client.invitation.create({ data });
      else {
        const updated = await client.invitation.updateMany({
          where: { id: row.id },
          data,
        });

        assertUpdated(updated.count);
      }
    }
  }

  for (const row of before.invitations ?? []) {
    if (!(after.invitations ?? []).some((item) => item.id === row.id))
      await client.invitation.deleteMany({ where: { id: row.id } });
  }

  for (const row of before.policies ?? []) {
    if (!(after.policies ?? []).some((item) => item.workspaceId === row.workspaceId))
      await client.securityPolicy.deleteMany({
        where: { workspaceId: row.workspaceId },
      });
  }

  for (const row of before.teams ?? []) {
    if (!(after.teams ?? []).some((item) => item.id === row.id))
      await client.team.deleteMany({ where: { id: row.id } });
  }

  for (const row of before.memberships ?? []) {
    if (!(after.memberships ?? []).some((item) => item.id === row.id))
      await client.membership.deleteMany({ where: { id: row.id } });
  }

  for (const row of before.permissions ?? []) {
    if (!(after.permissions ?? []).some((item) => item.id === row.id))
      await client.permission.deleteMany({ where: { id: row.id } });
  }

  for (const row of before.roles ?? []) {
    if (!(after.roles ?? []).some((item) => item.id === row.id))
      await client.role.deleteMany({ where: { id: row.id } });
  }

  for (const row of before.workspaces ?? []) {
    if (!(after.workspaces ?? []).some((item) => item.id === row.id))
      await client.workspace.deleteMany({ where: { id: row.id } });
  }
}
