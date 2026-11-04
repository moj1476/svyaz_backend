import type { IdentityData, RequestContext } from '../../../../../packages/contracts/src';
import type { AccessClient } from '../../../../../packages/contracts/src/access';
import type { TransactionStore } from '../../../../../packages/contracts/src/commands';
import { DomainError } from '../../../../../packages/contracts/src/errors';

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
