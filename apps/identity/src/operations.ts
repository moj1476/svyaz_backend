import { events } from './domain/events';
import type { IdentityData } from '../../../packages/contracts/src';
import type { AccessClient } from '../../../packages/contracts/src/access';
import type { TransactionStore } from '../../../packages/contracts/src/commands';
import { ServiceBase } from '../../../packages/runtime/src/service-base';
import { ReadService } from './application';
import { revokeSession } from './application/revoke-session/handler';
import { updateProfile } from './application/update-profile/handler';
import { IdentityPolicy } from './application/policies/identity.policy';

export class BusinessService extends ServiceBase<'identity'> {
  constructor(store: TransactionStore<IdentityData>, access: AccessClient) {
    const policy = new IdentityPolicy(store, access);

    super(
      'identity',
      store,
      access,
      new ReadService(store, access),
      {
        updateProfile: (input, context, data) =>
          updateProfile(policy, input, context, data),
        revokeSession: (input, context, data) =>
          revokeSession(policy, input, context, data),
      },
      events,
      policy.authorize.bind(policy),
    );
  }

  async userExists(id: string) {
    return (await this.store.load({ userIds: [id] })).users.some(
      (u) => u.id === id && u.status === 'ACTIVE',
    );
  }
}
