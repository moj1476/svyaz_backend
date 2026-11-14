import type { ApolloServerPlugin } from '@apollo/server';
import type { GraphQLContext } from '../context/create-context';

export function requestLogging(): ApolloServerPlugin<GraphQLContext> {
  return {
    async requestDidStart() {
      const started = performance.now();

      return {
        async willSendResponse(context) {
          console.log(
            JSON.stringify({
              level: 'info',
              event: 'graphql.completed',
              requestId: context.contextValue.requestId,
              operation: context.operationName ?? 'anonymous',
              durationMs: Math.round(performance.now() - started),
              errors: context.errors?.map((error) => error.extensions.code) ?? [],
            }),
          );
        },
      };
    },
  };
}
