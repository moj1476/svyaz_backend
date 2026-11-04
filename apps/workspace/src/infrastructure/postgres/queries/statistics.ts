import type { ServiceDatabase } from '../../../../../../packages/storage/src/prisma';
export async function aggregate(db: ServiceDatabase<'workspace'>, workspaceId: string) {
  const [totalMembers, activeMembers, pendingInvites] = await db.$transaction(
    [
      db.membership.count({ where: { workspaceId: workspaceId } }),
      db.membership.count({
        where: { workspaceId: workspaceId, status: 'ACTIVE' },
      }),
      db.invitation.count({
        where: {
          workspaceId: workspaceId,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
      }),
    ],
    { isolationLevel: 'RepeatableRead' },
  );

  return { totalMembers, activeMembers, pendingInvites };
}
