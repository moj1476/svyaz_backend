import { createHash } from 'node:crypto';
import { canonical } from './canonical';
import { DomainError, uuid } from './errors';
import { dateTime, record } from './validation';

export type CursorKind = 'string' | 'long' | 'date';

export interface CursorOptions {
  first?: number | null;
  after?: string | null;
  filter?: object | null;
  sort?: { field?: string | null; direction?: string | null } | null;
}

export function cursorPlan(
  options: CursorOptions,
  scope: string,
  fields: Record<string, CursorKind>,
  defaultField: string,
) {
  if (options.sort != null) record(options.sort, 'sort');

  const field = options.sort?.field ?? defaultField,
    direction = options.sort?.direction ?? 'ASC';

  const kind = Object.hasOwn(fields, field) ? fields[field] : undefined;

  if (!kind || !['ASC', 'DESC'].includes(direction))
    throw new DomainError('VALIDATION', 'Недопустимая сортировка');

  const first = options.first ?? 50;

  if (!Number.isInteger(first) || first < 1 || first > 100)
    throw new DomainError('VALIDATION', 'first от 1 до 100');

  const fingerprint = createHash('sha256')
    .update(canonical({ scope, filter: options.filter ?? {}, field, direction }))
    .digest('hex');

  let after: { key: string; id: string } | undefined;

  if (options.after != null) {
    try {
      if (
        typeof options.after !== 'string' ||
        !options.after.length ||
        options.after.length > 8192 ||
        !/^[A-Za-z0-9_-]+$/.test(options.after)
      )
        throw new Error();

      const parsed: unknown = JSON.parse(
        Buffer.from(options.after, 'base64url').toString(),
      );

      if (
        !Array.isArray(parsed) ||
        parsed.length !== 3 ||
        parsed[0] !== fingerprint ||
        typeof parsed[1] !== 'string' ||
        typeof parsed[2] !== 'string'
      )
        throw new Error();

      if (uuid(parsed[2]) !== parsed[2]) throw new Error();

      if (
        kind === 'long' &&
        (!/^\d+$/.test(parsed[1]) || BigInt(parsed[1]) > 9223372036854775807n)
      )
        throw new Error();

      if (kind === 'date' && dateTime(parsed[1]) !== parsed[1]) throw new Error();

      after = { key: parsed[1], id: parsed[2] };
    } catch {
      throw new DomainError('VALIDATION', 'Курсор не соответствует фильтру и сортировке');
    }
  }

  return {
    first,
    field,
    direction,
    kind,
    after,
    encode: (key: string | number | bigint, id: string) =>
      Buffer.from(JSON.stringify([fingerprint, String(key), id])).toString('base64url'),
  };
}

export function compareKeys(
  a: string | number | bigint,
  b: string | number | bigint,
): number {
  if (typeof a === 'string' && typeof b === 'string')
    return Buffer.compare(Buffer.from(a), Buffer.from(b));

  return a < b ? -1 : a > b ? 1 : 0;
}
