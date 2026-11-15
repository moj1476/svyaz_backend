import type { AuditData, RequestContext } from '#contracts';
import type { AccessClient } from '#contracts/access';
import { DomainError } from '#contracts/errors';
import type { QueryInput, QueryOutput } from '#contracts/queries';
import { identifier } from '#runtime/validation';
import { dateRange, inDates, page } from '#runtime/read-processing';
import type { AuditReadRepository } from '../ports/read-repository';

export async function auditEvents(
  policy: { access: AccessClient; repository: Partial<AuditReadRepository> },
  input: QueryInput<'auditEvents'>,
  context: RequestContext,
  snapshot: (context: RequestContext) => Promise<AuditData>,
  _requireWorkspace: (context: RequestContext, id: string) => Promise<void>,
): Promise<QueryOutput<'auditEvents'>> {
  const filter = input.filter,
    workspaceId = identifier(filter.workspaceId);

  dateRange(filter);

  if (!(await policy.access.permission(context, workspaceId, 'audit.read')))
    throw new DomainError('FORBIDDEN', 'Нет права audit.read');

  if (filter.actorId) identifier(filter.actorId);

  const actions = filter.actions as string[] | undefined;

  if (policy.repository.listEvents)
    return policy.repository.listEvents(input, context.userId);

  const data = await snapshot(context),
    rows = data.events.filter(
      (e) =>
        e.workspaceId === workspaceId &&
        (!filter.actorId || e.actorId === filter.actorId) &&
        (!filter.targetType || e.targetType === filter.targetType) &&
        (!actions || actions.includes(e.action)) &&
        inDates(e.occurredAt, filter),
    );

  return page(
    rows,
    input,
    `audit:${context.userId}`,
    { ID: (e) => e.id, CREATED_AT: (e) => e.occurredAt },
    'CREATED_AT',
  );
}
