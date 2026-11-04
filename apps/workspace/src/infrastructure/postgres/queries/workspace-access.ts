import type { ServiceDatabase } from '../../../../../../packages/storage/src/prisma';
export async function workspaceVisible(
  db: ServiceDatabase<'workspace'>,
  workspaceId: string,
  userId: string,
) {
  return !!(await db.membership.findFirst({
    where: {
      workspaceId: workspaceId,
      userId: userId,
      status: 'ACTIVE',
      workspaces: { status: 'ACTIVE' },
    },
    select: { id: true },
  }));
}
