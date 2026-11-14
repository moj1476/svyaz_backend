import type { User } from '#contracts';
import { DomainError } from '#contracts/errors';
import { Prisma } from '#generated/identity/client';
import { databaseFor } from '#storage/prisma';
import type { AuthAccounts, AuthSession } from '../../application/auth/ports';
import { fromUser } from './mapping';

export class AuthRepository implements AuthAccounts {
  private readonly db = databaseFor('identity');

  async register(
    user: Pick<User, 'id' | 'login' | 'displayName'>,
    passwordHash: string,
    session: AuthSession,
    activate: () => Promise<void>,
  ) {
    try {
      return await this.db.$transaction(async (tx) => {
        const row = await tx.user.create({
          data: { ...user, passwordHash, status: 'ACTIVE' },
        });
        await this.createSession(tx, session);
        await activate();
        return fromUser(row);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new DomainError('CONFLICT', 'Логин уже занят');
      throw error;
    }
  }

  async credentials(login: string) {
    const user = await this.db.user.findUnique({ where: { login } });
    return user && { ...fromUser(user), passwordHash: user.passwordHash };
  }

  async openSession(session: AuthSession, activate: () => Promise<void>) {
    await this.db.$transaction(async (tx) => {
      await this.createSession(tx, session);
      await activate();
    });
  }

  async isActive(userId: string, sessionId: string) {
    return !!(await this.db.session.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
        users: { status: 'ACTIVE' },
      },
      select: { id: true },
    }));
  }

  async revoke(userId: string, sessionId: string) {
    await this.db.session.updateMany({
      where: { id: sessionId, userId, status: 'ACTIVE' },
      data: { status: 'REVOKED' },
    });
  }

  close() {
    return this.db.$disconnect();
  }

  private async createSession(tx: Prisma.TransactionClient, session: AuthSession) {
    await tx.session.create({
      data: { ...session, status: 'ACTIVE', lastSeenAt: session.createdAt },
    });
  }
}
