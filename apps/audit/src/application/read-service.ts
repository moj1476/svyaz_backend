import type {
  AuditData,
  ReadRepository,
  RequestContext,
  ServiceClient,
} from '../../../../packages/contracts/src';
import type { AccessClient } from '../../../../packages/contracts/src/access';
import { queryDispatcher } from '../../../../packages/runtime/src/query-dispatch';
import { auditEvents } from './audit-events/query';
import type { AuditReadRepository } from './ports/read-repository';

export class ReadService implements ServiceClient<'audit'> {
  query = queryDispatcher({
    auditEvents: (input, context) =>
      auditEvents(
        { access: this.access, repository: this.repository },
        input,
        context,
        this.snapshot.bind(this),
        async () => {},
      ),
  });

  constructor(
    private readonly repository: ReadRepository<AuditData> & Partial<AuditReadRepository>,
    private readonly access: AccessClient,
  ) {}

  async snapshot(context: RequestContext): Promise<AuditData> {
    const access = this.access;
    const allowed = new Set<string>();

    for (const id of await access.workspaceIds(context))
      if (await access.permission(context, id, 'audit.read')) allowed.add(id);

    const data = await this.repository.load({
      actorId: context.userId,
      workspaceIds: [...allowed],
    });

    return { events: data.events.filter((e) => allowed.has(e.workspaceId)) };
  }
}
