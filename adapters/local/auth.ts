import { required } from '#config';
import { AuthService } from '#apps/identity/src/application/auth/service';
import { AuthRepository } from '#apps/identity/src/infrastructure/postgres/auth-repository';
import { AuthSessions } from '#apps/identity/src/infrastructure/redis/auth-sessions';
import { databaseFor } from '#storage/prisma';

export function createLocalAuth() {
  const accounts = new AuthRepository();
  const sessions = new AuthSessions();
  const workspace = databaseFor('workspace');
  const auth = new AuthService(
    accounts,
    sessions,
    async (userId) => {
      const memberships = await workspace.membership.findMany({
        where: { userId, status: 'ACTIVE', workspaces: { status: 'ACTIVE' } },
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
    },
    required('JWT_SECRET'),
    Number(required('AUTH_SESSION_TTL_SECONDS')),
  );

  return {
    auth,
    async close() {
      sessions.close();
      await Promise.all([accounts.close(), workspace.$disconnect()]);
    },
  };
}
