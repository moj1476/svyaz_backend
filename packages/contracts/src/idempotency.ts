import { createHash } from 'node:crypto';
import type { RequestContext } from './index';
import { canonical } from './canonical';
import { DomainError } from './errors';

export function commandIdentity(
  context: RequestContext,
  operation: string,
  input: Record<string, unknown>,
) {
  const raw =
    input.idempotencyKey ??
    input.actionId ??
    (operation === 'sendMessage' ? input.clientMessageId : undefined);

  if (raw === undefined) return null;

  if (typeof raw !== 'string' || !raw.trim() || raw.trim().length > 100)
    throw new DomainError(
      'VALIDATION',
      'idempotencyKey: требуется строка от 1 до 100 символов',
    );

  return {
    key: `${context.userId}:${operation}:${raw.trim()}`,
    hash: createHash('sha256').update(canonical(input)).digest('hex'),
  };
}
