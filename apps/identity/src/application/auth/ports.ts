import type { User } from '#contracts';

export interface AuthSession {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface AuthAccounts {
  register(
    user: Pick<User, 'id' | 'login' | 'displayName'>,
    passwordHash: string,
    session: AuthSession,
    activate: () => Promise<void>,
  ): Promise<User>;
  credentials(login: string): Promise<(User & { passwordHash: string | null }) | null>;
  openSession(session: AuthSession, activate: () => Promise<void>): Promise<void>;
  isActive(userId: string, sessionId: string): Promise<boolean>;
  revoke(userId: string, sessionId: string): Promise<void>;
}

export interface ActiveSessions {
  create(id: string, userId: string, expiresAt: number): Promise<void>;
  userId(id: string): Promise<string | null>;
  remove(id: string): Promise<void>;
  limit(ip: string): Promise<void>;
}
