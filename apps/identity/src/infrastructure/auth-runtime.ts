import { required } from '#config';
import type { WorkspaceRole } from '#contracts/auth';
import { AuthService } from '../application/auth/service';
import { AuthRepository } from './postgres/auth-repository';
import { AuthSessions } from './redis/auth-sessions';

export function createAuth(rolesForUser: (userId: string) => Promise<WorkspaceRole[]>) {
  const accounts = new AuthRepository();
  const sessions = new AuthSessions();
  const auth = new AuthService(
    accounts,
    sessions,
    rolesForUser,
    required('JWT_SECRET'),
    Number(required('AUTH_SESSION_TTL_SECONDS')),
  );

  return {
    auth,
    async close() {
      sessions.close();
      await accounts.close();
    },
  };
}
