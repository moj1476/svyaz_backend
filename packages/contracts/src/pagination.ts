import { DomainError } from './errors';

export interface PageArgs {
  first?: number;
  after?: string;
}

export function connection<T>(
  rows: T[],
  args: PageArgs,
  scope: string,
  key: (row: T) => string,
  defaultFirst = 50,
) {
  const first = args.first ?? defaultFirst;

  if (!Number.isInteger(first) || first < 1 || first > 100)
    throw new DomainError('VALIDATION', 'first должен быть от 1 до 100');

  let last: string | undefined;

  if (args.after) {
    try {
      const decoded: unknown = JSON.parse(
        Buffer.from(args.after, 'base64url').toString('utf8'),
      );

      if (
        !Array.isArray(decoded) ||
        decoded.length !== 2 ||
        decoded[0] !== scope ||
        typeof decoded[1] !== 'string'
      )
        throw new Error();

      last = decoded[1];
    } catch {
      throw new DomainError('VALIDATION', 'Курсор не соответствует запросу');
    }
  }

  const sorted = [...rows].sort((a, b) => key(a).localeCompare(key(b)));
  const remaining = sorted.filter((row) => last === undefined || key(row) > last);
  const edges = remaining.slice(0, first).map((node) => ({
    node,
    cursor: Buffer.from(JSON.stringify([scope, key(node)])).toString('base64url'),
  }));

  return {
    edges,
    pageInfo: {
      endCursor: edges.at(-1)?.cursor ?? null,
      hasNextPage: remaining.length > first,
    },
  };
}
