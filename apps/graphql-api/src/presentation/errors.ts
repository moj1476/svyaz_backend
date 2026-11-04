import { GraphQLError } from 'graphql';
import { DomainError } from '../../../../packages/contracts/src/errors';
import type { QueryContext } from '../context/query-context';

export function logFailure(error: unknown, requestId: string): void {
  const details =
    error instanceof Error
      ? { name: error.name, frames: error.stack?.split('\n').slice(1, 7) }
      : { name: 'UnknownError' };

  console.error(
    JSON.stringify({ level: 'error', event: 'request.failed', requestId, ...details }),
  );
}

export async function expose(
  action: () => Promise<unknown>,
  context: QueryContext,
): Promise<unknown> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof DomainError)
      throw new GraphQLError(error.message, {
        extensions: { code: error.code, requestId: context.requestId },
      });

    if (error instanceof GraphQLError) throw error;

    logFailure(error, context.requestId);

    throw new GraphQLError('Внутренняя ошибка системы', {
      extensions: { code: 'INTERNAL_SERVER_ERROR', requestId: context.requestId },
    });
  }
}
