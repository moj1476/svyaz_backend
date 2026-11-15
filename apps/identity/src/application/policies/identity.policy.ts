import type { IdentityData, RequestContext } from '#contracts';
import type { AccessClient } from '#contracts/access';
import type { TransactionStore } from '#contracts/commands';
import { DomainError } from '#contracts/errors';

export class IdentityPolicy {
  constructor(
    public readonly store: TransactionStore<IdentityData>,
    public readonly access: AccessClient,
  ) {}

  async authorize(_op: string, _i: Record<string, unknown>, context: RequestContext) {
    if (
      !(await this.store.load()).users.some(
        (u) => u.id === context.userId && u.status === 'ACTIVE',
      )
    )
      throw new DomainError('FORBIDDEN', 'Аккаунт недоступен');
  }
}
