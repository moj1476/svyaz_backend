import type { Conversation } from '../../../../../../packages/contracts/src';
import type { QueryInput } from '../../../../../../packages/contracts/src/queries';
import { addFilter, selectPage } from '../../../../../../packages/storage/src/page';

import type { SqlExecutor } from '../../../../../../packages/storage/src/prisma';
export async function listConversations(
  sql: SqlExecutor,
  input: QueryInput<'conversations'>,
  userId: string,
) {
  const filter = input.filter ?? {},
    values: unknown[] = [input.workspaceId, userId];

  const where = [
    'c.workspace_id=$1',
    "EXISTS(SELECT 1 FROM conversation_members cm WHERE cm.conversation_id=c.id AND cm.user_id=$2 AND cm.status='ACTIVE')",
  ];

  addFilter(where, values, 'c.type=?', filter.type);
  addFilter(where, values, 'c.status=?', filter.status);
  addFilter(where, values, 'c.visibility=?', filter.visibility);

  if (filter.text)
    addFilter(
      where,
      values,
      "strpos(lower(coalesce(c.title,'')),lower(?))>0",
      filter.text,
    );

  return selectPage<Conversation>(sql, {
    select: `c."id" AS "id", c."workspace_id" AS "workspaceId", c."type" AS "type", c."title" AS "title", c."visibility" AS "visibility", c."status" AS "status", c."version" AS "version", c."created_by" AS "createdBy"`,
    from: 'conversations c',
    id: 'c.id',
    where,
    values,
    options: input,
    scope: `conversations:${input.workspaceId}:${userId}`,
    defaultField: 'ID',
    fields: {
      ID: { sql: 'c.id::text', kind: 'string', value: (row) => row.id },
      TITLE: {
        sql: "coalesce(c.title,'')",
        kind: 'string',
        value: (row) => row.title ?? '',
      },
      TYPE: { sql: 'c.type', kind: 'string', value: (row) => row.type },
    },
  });
}
