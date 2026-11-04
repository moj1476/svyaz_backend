import type {
  PresenceData,
  ReadRepository,
  RequestContext,
  ServiceClient,
} from '../../../../packages/contracts/src';
import type { AccessClient } from '../../../../packages/contracts/src/access';

export class ReadService implements ServiceClient<'presence'> {
  constructor(
    private readonly repository: ReadRepository<PresenceData>,
    private readonly access: AccessClient,
  ) {}

  async snapshot(context: RequestContext): Promise<PresenceData> {
    const access = this.access;
    const workspaces = new Set(await access.workspaceIds(context));
    const data = await this.repository.load({
      actorId: context.userId,
      workspaceIds: [...workspaces],
    });

    return {
      presence: data.presence.filter((p) => workspaces.has(p.workspaceId)),
    };
  }
}
