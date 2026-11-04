import type { Membership } from '../../../../../../packages/contracts/src';
import type { QueryInput } from '../../../../../../packages/contracts/src/queries';
import { addFilter, selectPage } from '../../../../../../packages/storage/src/page';

import type { SqlExecutor } from '../../../../../../packages/storage/src/prisma';
export async function listMembers(
  sql: SqlExecutor,
  input: QueryInput<'members'>,
  userId: string,
) {
  const filter = input.filter ?? {},
    values: unknown[] = [input.workspaceId],
    where = ['m.workspace_id=$1'];

  addFilter(where, values, 'm.status=?', filter.status);
  addFilter(where, values, 'm.role_id=?', filter.roleId);
  addFilter(where, values, 'm.user_id=?', filter.userId);

  return selectPage<Membership>(sql, {
    select: `m."id" AS "id", m."workspace_id" AS "workspaceId", m."user_id" AS "userId", m."role_id" AS "roleId", m."status" AS "status", m."joined_at" AS "joinedAt", m."version" AS "version"`,
    from: 'memberships m',
    id: 'm.id',
    where,
    values,
    options: input,
    scope: `members:${input.workspaceId}:${userId}`,
    defaultField: 'ID',
    fields: {
      ID: { sql: 'm.id::text', kind: 'string', value: (row) => row.id },
      JOINED_AT: { sql: 'm.joined_at', kind: 'date', value: (row) => row.joinedAt },
    },
  });
}
