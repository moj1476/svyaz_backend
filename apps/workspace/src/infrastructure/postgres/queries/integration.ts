import type { ServiceDatabase } from '#storage/prisma';
import type { WorkspaceRole } from '#contracts/auth';

export async function rolesForUser(
  db: ServiceDatabase<'workspace'>,
  id: string,
): Promise<WorkspaceRole[]> {
  const memberships = await db.membership.findMany({
    where: { userId: id, status: 'ACTIVE', workspaces: { status: 'ACTIVE' } },
    select: {
      workspaceId: true,
      roles: { select: { id: true, code: true, workspaceId: true } },
    },
  });
  return memberships
    .filter(({ workspaceId, roles }) => workspaceId === roles.workspaceId)
    .map(({ workspaceId, roles }) => ({
      workspaceId,
      roleId: roles.id,
      code: roles.code,
    }));
}

export async function activeMembers(
  db: ServiceDatabase<'workspace'>,
  workspaceId: string,
) {
  const rows = await db.membership.findMany({
    where: { workspaceId, status: 'ACTIVE', workspaces: { status: 'ACTIVE' } },
    select: { userId: true },
  });
  return rows.map(({ userId }) => userId);
}
