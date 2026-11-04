import { DomainError, uuid } from '../../contracts/src/errors';
export function text(value: unknown, name: string, max = 200): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    throw new DomainError(
      'VALIDATION',
      `${name}: требуется строка от 1 до ${max} символов`,
    );

  return value.trim();
}
export function identifier(value: unknown, name = 'id'): string {
  if (typeof value !== 'string')
    throw new DomainError('VALIDATION', `${name}: требуется UUID`);

  return uuid(value);
}
export function bool(value: unknown): boolean {
  if (typeof value !== 'boolean')
    throw new DomainError('VALIDATION', 'Требуется логическое значение');

  return value;
}
