import type { Message } from '../../../../../../packages/contracts/src';
import type { QueryInput } from '../../../../../../packages/contracts/src/queries';
import { addFilter, selectPage } from '../../../../../../packages/storage/src/page';

import type { SqlExecutor } from '../../../../../../packages/storage/src/prisma';
export async function listMessages(
  sql: SqlExecutor,
  input: QueryInput<'messages'> | QueryInput<'thread'>,
  conversationId: string,
  rootId: string | null,
  userId: string,
) {
  const filter = input.filter ?? {},
    values: unknown[] = [conversationId, userId];

  const where = [
    'm.conversation_id=$1',
    "EXISTS(SELECT 1 FROM conversation_members cm WHERE cm.conversation_id=m.conversation_id AND cm.user_id=$2 AND cm.status='ACTIVE')",
  ];

  if (rootId) {
    values.push(rootId);
    where.push(`m.thread_root_id=$${values.length}`);
  } else where.push('m.thread_root_id IS NULL');

  addFilter(where, values, 'm.sender_id=?', filter.senderId);
  addFilter(where, values, 'm.status=?', filter.status);

  if (filter.text)
    addFilter(
      where,
      values,
      "strpos(lower(coalesce(m.body,'')),lower(?))>0",
      filter.text,
    );

  addFilter(where, values, 'm.sent_at>=?::timestamptz', filter.from);
  addFilter(where, values, 'm.sent_at<=?::timestamptz', filter.to);

  const result = await selectPage<Message>(sql, {
    select: `m."id" AS "id", m."conversation_id" AS "conversationId", m."sender_id" AS "senderId", m."sequence" AS "sequence", m."body" AS "body", m."status" AS "status", m."thread_root_id" AS "threadRootId", m."sent_at" AS "sentAt", m."edited_at" AS "editedAt", m."version" AS "version", m."client_message_id" AS "clientMessageId"`,
    from: 'messages m',
    id: 'm.id',
    where,
    values,
    options: input,
    scope: `${rootId ? 'thread' : 'messages'}:${conversationId}:${rootId ?? ''}:${userId}`,
    defaultField: 'SEQUENCE',
    fields: {
      SEQUENCE: {
        sql: 'm.sequence',
        kind: 'long',
        value: (row) => BigInt(row.sequence),
      },
      SENT_AT: { sql: 'm.sent_at', kind: 'date', value: (row) => row.sentAt },
      ID: { sql: 'm.id::text', kind: 'string', value: (row) => row.id },
    },
  });

  for (const edge of result.edges)
    if (edge.node.status === 'DELETED') edge.node.body = null;

  return result;
}
