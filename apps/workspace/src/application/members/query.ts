import type {
  RequestContext,
  WorkspaceData,
} from '../../../../../packages/contracts/src';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import type {
  QueryInput,
  QueryOutput,
} from '../../../../../packages/contracts/src/queries';
import { identifier } from '../../../../../packages/runtime/src/validation';
import { page } from '../../../../../packages/runtime/src/read-processing';
import type { WorkspacePolicy } from '../policies/workspace.policy';

export async function members(
  policy: WorkspacePolicy,
  input: QueryInput<'members'>,
  context: RequestContext,
  snapshot: (context: RequestContext) => Promise<WorkspaceData>,
  _requireWorkspace: (context: RequestContext, id: string) => Promise<void>,
): Promise<QueryOutput<'members'>> {
  if (policy.store.listMembers && policy.store.workspaceVisible) {
    const workspaceId = identifier(input.workspaceId);

    if (!(await policy.store.workspaceVisible(workspaceId, context.userId)))
      throw new DomainError('FORBIDDEN', 'Пространство недоступно');

    if (!(await policy.access.permission(context, workspaceId, 'workspace.members.read')))
      throw new DomainError('FORBIDDEN', 'Недостаточно прав');

    return policy.store.listMembers(input, context.userId);
  }

  const data = await snapshot(context),
    workspaceId = identifier(input.workspaceId);

  if (!data.workspaces.some((v) => v.id === workspaceId))
    throw new DomainError('FORBIDDEN', 'Пространство недоступно');

  const filter = input.filter ?? {};

  if (filter.roleId) identifier(filter.roleId);

  if (filter.userId) identifier(filter.userId);

  if (!(await policy.access.permission(context, workspaceId, 'workspace.members.read')))
    throw new DomainError('FORBIDDEN', 'Недостаточно прав');

  const rows = data.memberships.filter(
    (m) =>
      m.workspaceId === workspaceId &&
      (!filter.status || m.status === filter.status) &&
      (!filter.roleId || m.roleId === filter.roleId) &&
      (!filter.userId || m.userId === filter.userId),
  );

  return page(
    rows,
    input,
    `members:${workspaceId}:${context.userId}`,
    { ID: (m) => m.id, JOINED_AT: (m) => m.joinedAt },
    'ID',
  );
}
