import { DomainError } from '../../contracts/src/errors';
export function exactVersion(value: unknown): bigint {
  if (
    typeof value !== 'string' ||
    !/^\d+$/.test(value) ||
    BigInt(value) < 1n ||
    BigInt(value) > 9223372036854775807n
  )
    throw new DomainError('VALIDATION', 'Неверная версия');

  return BigInt(value);
}
export function version(row: { version: string }, expected: unknown) {
  if (BigInt(row.version) !== exactVersion(expected))
    throw new DomainError(
      'STALE_VERSION',
      'Объект уже изменён; перечитайте актуальную версию',
      'expectedVersion',
    );

  if (BigInt(row.version) === 9223372036854775807n)
    throw new DomainError('CONFLICT', 'Диапазон версии исчерпан');

  row.version = (BigInt(row.version) + 1n).toString();
}
