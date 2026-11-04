import type {
  IdentityData,
  ReadRepository,
  RequestContext,
  ServiceClient,
} from '../../../../packages/contracts/src';
import type { AccessClient } from '../../../../packages/contracts/src/access';

export class ReadService implements ServiceClient<'identity'> {
  constructor(
    private readonly repository: ReadRepository<IdentityData>,
    private readonly access: AccessClient,
  ) {}

  async snapshot(context: RequestContext): Promise<IdentityData> {
    const access = this.access;
    const visible = new Set([context.userId, ...(await access.visibleUserIds(context))]);
    const data = await this.repository.load({
      actorId: context.userId,
      userIds: [...visible],
    });

    const sessions = data.sessions.filter((s) => s.userId === context.userId);

    return {
      users: data.users.filter((u) => visible.has(u.id)),
      sessions,
      devices: data.devices.filter((d) => sessions.some((s) => s.deviceId === d.id)),
    };
  }
}
