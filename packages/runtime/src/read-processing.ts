import { compareKeys, cursorPlan, type CursorKind } from '../../contracts/src/cursor';
import { DomainError } from '../../contracts/src/errors';
import { dateTime } from '../../contracts/src/validation';

export interface ListOptions {
  first?: number | null;
  after?: string | null;
  filter?: object | null;
  sort?: { field?: string | null; direction?: string | null } | null;
}

export interface DateRange {
  readonly from?: string | null;
  readonly to?: string | null;
}

export function dateRange(filter: DateRange) {
  if (filter.from != null) dateTime(filter.from, 'from');

  if (filter.to != null) dateTime(filter.to, 'to');

  if (filter.from && filter.to && Date.parse(filter.from) > Date.parse(filter.to))
    throw new DomainError('VALIDATION', 'Начало периода позже окончания');
}

export function inDates(value: string | undefined, filter: DateRange) {
  return (
    (!filter.from || (!!value && Date.parse(value) >= Date.parse(String(filter.from)))) &&
    (!filter.to || (!!value && Date.parse(value) <= Date.parse(String(filter.to))))
  );
}

export function page<T extends { id: string }>(
  rows: T[],
  options: ListOptions,
  scope: string,
  fields: Record<string, (row: T) => string | number | bigint>,
  defaultField: string,
) {
  const kinds = Object.fromEntries(
    Object.keys(fields).map((field) => [
      field,
      field === 'SEQUENCE'
        ? 'long'
        : ['SENT_AT', 'CREATED_AT', 'JOINED_AT'].includes(field)
          ? 'date'
          : 'string',
    ]),
  ) as Record<string, CursorKind>;

  const plan = cursorPlan(options, scope, kinds, defaultField);
  const select = fields[plan.field]!;
  const sign = plan.direction === 'DESC' ? -1 : 1;
  const sorted = [...rows].sort(
    (a, b) => (compareKeys(select(a), select(b)) || compareKeys(a.id, b.id)) * sign,
  );

  const remaining = plan.after
    ? sorted.filter(
        (row) =>
          (compareKeys(
            select(row),
            plan.kind === 'long' ? BigInt(plan.after!.key) : plan.after!.key,
          ) || compareKeys(row.id, plan.after!.id)) *
            sign >
          0,
      )
    : sorted;

  const selected = remaining.slice(0, plan.first);
  const edges = selected.map((node) => ({
    node,
    cursor: plan.encode(select(node), node.id),
  }));

  return {
    edges,
    pageInfo: {
      endCursor: edges.at(-1)?.cursor ?? null,
      hasNextPage: remaining.length > plan.first,
    },
  };
}
