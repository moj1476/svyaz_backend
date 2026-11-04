import { wireValue, type SqlExecutor } from './prisma';
import {
  cursorPlan,
  type CursorKind,
  type CursorOptions,
} from '../../contracts/src/cursor';
import type { Connection } from '../../contracts/src/queries';

export interface SqlPageField<T> {
  sql: string;
  kind: CursorKind;
  value: (row: T) => string | number | bigint;
}

export interface SqlPage<T> {
  select: string;
  from: string;
  id: string;
  where: string[];
  values: unknown[];
  fields: Record<string, SqlPageField<T>>;
  defaultField: string;
  scope: string;
  options: CursorOptions;
}

export function normalizeRow<T>(row: Record<string, unknown>): T {
  return wireValue(row) as T;
}

export async function selectPage<T extends { id: string }>(
  pool: SqlExecutor,
  query: SqlPage<T>,
): Promise<Connection<T>> {
  const kinds = Object.fromEntries(
    Object.entries(query.fields).map(([key, field]) => [key, field.kind]),
  );

  const plan = cursorPlan(query.options, query.scope, kinds, query.defaultField);
  const field = query.fields[plan.field]!;
  const expression = plan.kind === 'string' ? `(${field.sql}) COLLATE "C"` : field.sql;
  const where = [...query.where],
    values = [...query.values];

  if (plan.after) {
    values.push(plan.after.key, plan.after.id);

    const type =
      plan.kind === 'long' ? 'bigint' : plan.kind === 'date' ? 'timestamptz' : 'text';

    const parameter = `$${values.length - 1}::${type}${plan.kind === 'string' ? ' COLLATE "C"' : ''}`;

    where.push(
      `(${expression}, ${query.id}) ${plan.direction === 'DESC' ? '<' : '>'} (${parameter}, $${values.length}::uuid)`,
    );
  }

  values.push(plan.first + 1);

  const result = await pool.query(
    `SELECT ${query.select} FROM ${query.from} WHERE ${where.length ? where.join(' AND ') : 'TRUE'} ORDER BY ${expression} ${plan.direction}, ${query.id} ${plan.direction} LIMIT $${values.length}`,
    values,
  );

  const rows = result.rows.map((row) => normalizeRow<T>(row));
  const edges = rows
    .slice(0, plan.first)
    .map((node) => ({ node, cursor: plan.encode(field.value(node), node.id) }));

  return {
    edges,
    pageInfo: {
      endCursor: edges.at(-1)?.cursor ?? null,
      hasNextPage: rows.length > plan.first,
    },
  };
}

export function addFilter(
  where: string[],
  values: unknown[],
  sql: string,
  value: unknown,
): void {
  if (value == null) return;

  values.push(value);
  where.push(sql.replace('?', `$${values.length}`));
}
