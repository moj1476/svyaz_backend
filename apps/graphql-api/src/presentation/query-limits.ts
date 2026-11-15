import type { ApolloServerPlugin } from '@apollo/server';
import { depthLimit } from '@graphile/depth-limit';
import { getComplexity } from 'graphql-query-complexity';
import { GraphQLError, Kind, visit, type ValidationRule } from 'graphql';

function limitError() {
  return new GraphQLError('Запрос превышает допустимую глубину или стоимость', {
    extensions: { code: 'VALIDATION' },
  });
}

const documentLimits: ValidationRule = (context) => ({
  Document(document) {
    const operations = document.definitions.filter(
      (definition) => definition.kind === Kind.OPERATION_DEFINITION,
    );
    let fields = 0;
    visit(document, {
      Field: () => {
        fields++;
      },
    });
    if (operations.length > 10 || fields > 500) context.reportError(limitError());
  },
});

export const queryLimits = [
  documentLimits,
  depthLimit({
    maxDepth: 16,
    maxListDepth: 16,
    maxSelfReferentialDepth: 16,
    maxIntrospectionDepth: 16,
    maxIntrospectionListDepth: 16,
    maxIntrospectionSelfReferentialDepth: 16,
  }),
];

export function queryCost(): ApolloServerPlugin {
  return {
    async requestDidStart() {
      return {
        async didResolveOperation({ document, operation, request, schema }) {
          if (!operation) return;
          let fields = 0;
          let cost: number;
          try {
            cost = getComplexity({
              schema,
              query: {
                ...document,
                definitions: [
                  operation,
                  ...document.definitions.filter(
                    (node) => node.kind === Kind.FRAGMENT_DEFINITION,
                  ),
                ],
              },
              variables: request.variables,
              maxQueryNodes: 2000,
              estimators: [
                ({ field, args, childComplexity }) => {
                  fields++;
                  const first = field.args.find((arg) => arg.name === 'first');
                  const count = Number(args.first ?? first?.defaultValue ?? 50);
                  return (
                    1 + childComplexity * (first ? Math.max(1, Math.min(100, count)) : 1)
                  );
                },
              ],
            });
          } catch (error) {
            if (error instanceof GraphQLError && error.message.startsWith('Variable '))
              throw new GraphQLError('Некорректные параметры запроса', {
                extensions: { code: 'BAD_USER_INPUT' },
              });
            throw limitError();
          }
          if (fields > 500 || cost > 20000) throw limitError();
        },
      };
    },
  };
}
