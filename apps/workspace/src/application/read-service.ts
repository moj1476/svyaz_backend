import type {
  ReadRepository,
  RequestContext,
  ServiceClient,
  WorkspaceData,
} from '#contracts';
import type { AccessClient } from '#contracts/access';

export class ReadService implements ServiceClient<'workspace'> {
  constructor(
    private readonly repository: ReadRepository<WorkspaceData>,
    _access: AccessClient,
  ) {}

  async snapshot(context: RequestContext): Promise<WorkspaceData> {
    const data = await this.repository.load({ actorId: context.userId });
    const workspaceIds = new Set(
      data.memberships
        .filter((m) => m.userId === context.userId && m.status === 'ACTIVE')
        .map((m) => m.workspaceId),
    );

    return {
      workspaces: data.workspaces.filter((w) => workspaceIds.has(w.id)),
      memberships: data.memberships.filter((m) => workspaceIds.has(m.workspaceId)),
      roles: data.roles.filter((r) => workspaceIds.has(r.workspaceId)),
      permissions: data.permissions,
      teams: data.teams.filter((t) => workspaceIds.has(t.workspaceId)),
      policies: data.policies.filter((p) => workspaceIds.has(p.workspaceId)),
    };
  }
}
