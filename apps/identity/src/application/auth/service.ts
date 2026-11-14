import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { DomainError } from '#contracts/errors';
import type { RequestContext } from '#contracts';
import type { AuthenticatedSession, WorkspaceRole } from '#contracts/auth';
import type { ActiveSessions, AuthAccounts } from './ports';
import { AccessToken } from './access-token';
import { hashPassword, verifyPassword } from './password';

const credentials = z.object({
  login: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.-]{3,64}$/),
  password: z.string().min(1).max(128),
});
const registration = credentials.extend({
  displayName: z.string().trim().min(1).max(80),
  password: z.string().min(15).max(128),
});

export class AuthService {
  private readonly tokens: AccessToken;

  constructor(
    private readonly accounts: AuthAccounts,
    private readonly sessions: ActiveSessions,
    private readonly rolesForUser: (userId: string) => Promise<WorkspaceRole[]>,
    secret: string,
    private readonly ttl: number,
  ) {
    this.tokens = new AccessToken(secret);
    if (!Number.isSafeInteger(ttl) || ttl < 1 || ttl > 86400)
      throw new Error('AUTH_SESSION_TTL_SECONDS должен быть целым числом от 1 до 86400');
  }

  async register(input: unknown, ip: string) {
    const parsed = registration.safeParse(input);
    if (!parsed.success)
      throw new DomainError(
        'VALIDATION',
        'Проверьте логин, имя и длину пароля (15–128 символов)',
      );

    await this.sessions.limit(ip);
    const { login, displayName, password } = parsed.data;
    const passwordHash = await hashPassword(password);
    const id = randomUUID();
    const { session, payload, activate } = this.newSession(id);
    const user = await this.accounts.register(
      { id, login, displayName },
      passwordHash,
      session,
      activate,
    );
    return { ...payload, user, workspaceRoles: [] as WorkspaceRole[] };
  }

  async login(input: unknown, ip: string) {
    const parsed = credentials.safeParse(input);
    if (!parsed.success) throw this.invalidCredentials();
    await this.sessions.limit(ip);
    const { login, password } = parsed.data;
    const user = await this.accounts.credentials(login);
    const valid = await verifyPassword(password, user?.passwordHash ?? null);
    if (!user || !valid || user.status !== 'ACTIVE') throw this.invalidCredentials();
    const workspaceRoles = await this.rolesForUser(user.id);
    const { session, payload, activate } = this.newSession(user.id);
    await this.accounts.openSession(session, activate);
    const { passwordHash: _passwordHash, ...profile } = user;
    return { ...payload, user: profile, workspaceRoles };
  }

  async authenticate(
    authorization: string | undefined,
    requestId: string,
  ): Promise<RequestContext & AuthenticatedSession> {
    const token = /^Bearer ([^\s]+)$/i.exec(authorization ?? '')?.[1];
    if (!token) throw this.signInRequired();

    const { userId, sessionId } = this.tokens.verify(
      token,
      Math.floor(Date.now() / 1000),
    );
    if ((await this.sessions.userId(sessionId)) !== userId) throw this.signInRequired();

    if (!(await this.accounts.isActive(userId, sessionId))) throw this.signInRequired();
    const workspaceRoles = await this.rolesForUser(userId);

    return { userId, requestId, sessionId, workspaceRoles };
  }

  async logout(userId: string, sessionId: string) {
    await this.sessions.remove(sessionId);
    await this.accounts.revoke(userId, sessionId);
    return true;
  }

  private newSession(userId: string) {
    const id = randomUUID();
    const issuedAt = Math.floor(Date.now() / 1000);
    const expires = issuedAt + this.ttl;
    const expiresAt = new Date(expires * 1000);
    return {
      session: { id, userId, createdAt: new Date(issuedAt * 1000), expiresAt },
      payload: {
        sessionId: id,
        expiresAt: expiresAt.toISOString(),
        accessToken: this.tokens.issue(userId, id, issuedAt, expires),
      },
      activate: () => this.sessions.create(id, userId, expires),
    };
  }

  private invalidCredentials() {
    return new DomainError('INVALID_CREDENTIALS', 'Неверный логин или пароль');
  }

  private signInRequired() {
    return new DomainError('UNAUTHENTICATED', 'Требуется вход в аккаунт');
  }
}
