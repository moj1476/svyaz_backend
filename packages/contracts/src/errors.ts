export type ErrorCode =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'UNAVAILABLE'
  | 'UNAUTHENTICATED'
  | 'CONFLICT'
  | 'STALE_VERSION'
  | 'INVALID_STATE';

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly field: string | null = null,
  ) {
    super(message);
  }
}

export function uuid(value: string): string {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new DomainError('VALIDATION', 'Ожидался UUID');

  return value.toLowerCase();
}
