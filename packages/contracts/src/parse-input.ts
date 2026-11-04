import type { CommandInput, CommandName } from './command-map';
import { DomainError, uuid } from './errors';
import {
  commandSchemas,
  enumValues,
  inputObjects,
  querySchemas,
  type FieldSchema,
} from './input-schema';
import type { QueryInput, QueryName } from './queries';
import { dateTime, record } from './validation';

function invalid(field: string, message: string): never {
  throw new DomainError('VALIDATION', `${field}: ${message}`, field);
}

function value(type: string, input: unknown, field: string): unknown {
  if (type.endsWith('!')) {
    if (input == null) invalid(field, 'обязательное поле');

    return value(type.slice(0, -1), input, field);
  }

  if (input == null) return input;

  if (type.startsWith('[')) {
    if (!Array.isArray(input)) invalid(field, 'ожидается список');

    return input.map((item, index) =>
      value(type.slice(1, -1), item, `${field}[${index}]`),
    );
  }

  const fields = inputObjects[type];

  if (fields) return object(fields, input, field);

  const members = enumValues[type];

  if (members) {
    if (typeof input !== 'string' || !members.includes(input))
      invalid(field, 'недопустимое значение');

    return input;
  }

  if (type === 'JSON') return input;

  if (type === 'Int') {
    if (
      typeof input !== 'number' ||
      !Number.isInteger(input) ||
      input < -2147483648 ||
      input > 2147483647
    )
      invalid(field, 'ожидается int32');

    return input;
  }

  if (type === 'Boolean') {
    if (typeof input !== 'boolean') invalid(field, 'ожидается логическое значение');

    return input;
  }

  if (typeof input !== 'string') invalid(field, 'ожидается строка');

  if (type === 'ID') return uuid(input);

  if (type === 'DateTime') return dateTime(input, field);

  if (type === 'Long') {
    if (
      !/^-?\d+$/.test(input) ||
      BigInt(input) < -(2n ** 63n) ||
      BigInt(input) > 2n ** 63n - 1n
    )
      invalid(field, 'ожидается точный int64 строкой');

    return BigInt(input).toString();
  }

  return input;
}

function object(
  fields: Record<string, FieldSchema>,
  input: unknown,
  field: string,
): Record<string, unknown> {
  const source = record(input, field);

  for (const key of Object.keys(source))
    if (!Object.hasOwn(fields, key)) invalid(`${field}.${key}`, 'неизвестное поле');

  const result: Record<string, unknown> = {};

  for (const [name, schema] of Object.entries(fields)) {
    const input =
      source[name] === undefined ? structuredClone(schema.default) : source[name];

    const parsed = value(schema.type, input, `${field}.${name}`);

    if (parsed !== undefined) result[name] = parsed;
  }

  return result;
}

export function parseCommandInput<N extends CommandName>(
  name: N,
  input: unknown,
): CommandInput<N> {
  const fields = commandSchemas[name];

  if (!fields) invalid('operation', 'неизвестная команда');

  return object(fields, input, name) as CommandInput<N>;
}

export function parseQueryInput<N extends QueryName>(
  name: N,
  input: unknown,
): QueryInput<N> {
  const fields = querySchemas[name];

  if (!fields) invalid('operation', 'неизвестный запрос');

  return object(fields, input, name) as QueryInput<N>;
}
