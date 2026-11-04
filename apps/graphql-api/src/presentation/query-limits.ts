import {
  GraphQLError,
  Kind,
  getNamedType,
  isCompositeType,
  type GraphQLCompositeType,
  type SelectionSetNode,
  type FragmentDefinitionNode,
  type ValidationRule,
} from 'graphql';

export function queryLimits(
  maxDepth = 16,
  maxFields = 500,
  maxCost = 20000,
): ValidationRule {
  return (context) => ({
    Document(document) {
      const fragments = new Map<string, FragmentDefinitionNode>();

      for (const definition of document.definitions)
        if (definition.kind === Kind.FRAGMENT_DEFINITION)
          fragments.set(definition.name.value, definition);

      let fields = 0,
        depth = 0;

      function measure(
        set: SelectionSetNode,
        parent: GraphQLCompositeType | undefined,
        level: number,
        active: Set<string>,
      ): number {
        depth = Math.max(depth, level);

        let cost = 0;

        for (const selection of set.selections) {
          if (selection.kind === Kind.FIELD) {
            fields++;

            const field =
              parent && 'getFields' in parent
                ? parent.getFields()[selection.name.value]
                : undefined;

            const next = field ? getNamedType(field.type) : undefined;
            const first = selection.arguments?.find((arg) => arg.name.value === 'first');
            const multiplier = field?.args.some((arg) => arg.name === 'first')
              ? first?.value.kind === Kind.INT
                ? Math.max(1, Math.min(100, Number(first.value.value)))
                : first
                  ? 100
                  : Number(
                      field.args.find((arg) => arg.name === 'first')?.defaultValue ?? 50,
                    )
              : 1;

            cost +=
              1 +
              (selection.selectionSet
                ? multiplier *
                  measure(
                    selection.selectionSet,
                    next && isCompositeType(next) ? next : undefined,
                    level + 1,
                    active,
                  )
                : 0);
          } else if (selection.kind === Kind.INLINE_FRAGMENT) {
            const type = selection.typeCondition
              ? context.getSchema().getType(selection.typeCondition.name.value)
              : parent;

            cost += measure(
              selection.selectionSet,
              type && isCompositeType(type) ? type : parent,
              level,
              active,
            );
          } else {
            const name = selection.name.value,
              fragment = fragments.get(name);

            if (!fragment || active.has(name)) continue;

            const type = context.getSchema().getType(fragment.typeCondition.name.value);

            cost += measure(
              fragment.selectionSet,
              type && isCompositeType(type) ? type : parent,
              level,
              new Set([...active, name]),
            );
          }

          if (fields > maxFields || depth > maxDepth || cost > maxCost)
            return maxCost + 1;
        }

        return cost;
      }

      const operations = document.definitions.filter(
        (definition) => definition.kind === Kind.OPERATION_DEFINITION,
      );

      let cost = 0;

      for (const operation of operations) {
        const schema = context.getSchema(),
          type =
            operation.operation === 'mutation'
              ? schema.getMutationType()
              : operation.operation === 'subscription'
                ? schema.getSubscriptionType()
                : schema.getQueryType();

        cost += measure(operation.selectionSet, type ?? undefined, 1, new Set());
      }

      if (
        operations.length > 10 ||
        fields > maxFields ||
        depth > maxDepth ||
        cost > maxCost
      )
        context.reportError(
          new GraphQLError('Запрос превышает допустимую глубину или стоимость', {
            nodes: document,
            extensions: { code: 'VALIDATION' },
          }),
        );
    },
  });
}
