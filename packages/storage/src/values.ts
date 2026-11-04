import type { Prisma } from '../../../generated/identity/client';
import { canonical } from '../../contracts/src/canonical';
import { DomainError } from '../../contracts/src/errors';

export function jsonValue(value: unknown): Prisma.InputJsonValue {
  const encoded = JSON.stringify(value);

  if (encoded === undefined || encoded === 'null')
    throw new Error('Ожидалось непустое значение JSON');

  return JSON.parse(encoded) as Prisma.InputJsonValue;
}

export function assertUpdated(count: number): void {
  if (count !== 1)
    throw new DomainError('STALE_VERSION', 'Конкурирующее изменение данных');
}

export { canonical };
