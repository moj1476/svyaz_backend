import type { RequestContext } from '../../contracts/src';
import { DomainError } from '../../contracts/src/errors';
import type { QueryInput, QueryName, QueryOutput } from '../../contracts/src/queries';

export type QueryHandlers = {
  [N in QueryName]?: (
    input: QueryInput<N>,
    context: RequestContext,
  ) => Promise<QueryOutput<N>>;
};

export function queryDispatcher(handlers: QueryHandlers) {
  return async <N extends QueryName>(
    name: N,
    input: QueryInput<N>,
    context: RequestContext,
  ): Promise<QueryOutput<N>> => {
    const handler = handlers[name] as
      | ((input: QueryInput<N>, context: RequestContext) => Promise<QueryOutput<N>>)
      | undefined;

    if (!handler)
      throw new DomainError('VALIDATION', 'Операция чтения не поддерживается');

    return handler(input, context);
  };
}
