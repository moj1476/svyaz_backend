import { GraphQLError, GraphQLScalarType, Kind, type ValueNode } from 'graphql';
import GraphQLJSON from 'graphql-type-json';
import { dateTime } from '../../../../packages/contracts/src/validation';

function long(value: unknown): string {
  if (typeof value === 'number' && !Number.isSafeInteger(value))
    throw new GraphQLError('Для Long требуется точная десятичная строка');

  if (
    !['string', 'number', 'bigint'].includes(typeof value) ||
    !/^-?\d+$/.test(String(value))
  )
    throw new GraphQLError('Некорректное значение Long');

  const n = BigInt(String(value));

  if (n < -(2n ** 63n) || n > 2n ** 63n - 1n)
    throw new GraphQLError('Значение Long выходит за диапазон 64-битного целого числа');

  return n.toString();
}

function date(value: unknown): string {
  try {
    return dateTime(value);
  } catch (error) {
    throw new GraphQLError((error as Error).message, {
      extensions: { code: 'VALIDATION' },
    });
  }
}

const literal = (node: ValueNode) => {
  if (node.kind !== Kind.STRING && node.kind !== Kind.INT)
    throw new GraphQLError('Ожидался скалярный литерал');

  return node.value;
};

export const scalars = {
  JSON: GraphQLJSON,
  Long: new GraphQLScalarType({
    name: 'Long',
    serialize: long,
    parseValue: long,
    parseLiteral: (n) => long(literal(n)),
  }),
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    serialize: date,
    parseValue: date,
    parseLiteral: (n) => date(literal(n)),
  }),
};
