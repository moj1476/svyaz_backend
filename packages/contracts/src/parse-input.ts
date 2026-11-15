import { z } from 'zod';
import type { CommandInput, CommandName } from './command-map';
import { DomainError } from './errors';
import {
  commandSchemas,
  enumValues,
  commandInputTypes,
  querySchemas,
  type FieldSchema,
} from './input-schema';
import type { QueryInput, QueryName } from './queries';
import * as validation from './graphql-validation';
import { wireScalars } from './wire-scalars';

function inputSchema(name: string): z.ZodType | undefined {
  const factory = (validation as Record<string, unknown>)[name + 'Schema'];
  return typeof factory === 'function' ? (factory as () => z.ZodType)() : undefined;
}

function schemaFor(type: string): z.ZodType {
  const required = type.endsWith('!');
  const name = required ? type.slice(0, -1) : type;
  let schema: z.ZodType;

  if (name.startsWith('['))
    schema = z.array(schemaFor(name.slice(1, -1)), { error: 'ожидается список' });
  else if (Object.hasOwn(enumValues, name))
    schema = z.enum(enumValues[name]!, { error: 'недопустимое значение' });
  else
    schema =
      inputSchema(name) ??
      (wireScalars as Record<string, z.ZodType>)[name] ??
      z.string({ error: 'ожидается строка' });

  return required ? schema : schema.nullish();
}

function objectSchema(fields: Record<string, FieldSchema>) {
  const shape = Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [
      name,
      field.default === undefined
        ? schemaFor(field.type)
        : schemaFor(field.type).prefault(field.default),
    ]),
  );

  return z
    .strictObject(shape, { error: 'ожидается объект' })
    .transform((input) =>
      Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined),
      ),
    );
}

const commands = new Map(
  Object.entries(commandSchemas).map(([name, fields]) => [
    name,
    inputSchema(commandInputTypes[name] ?? '') ?? objectSchema(fields),
  ]),
);
const queries = new Map(
  Object.entries(querySchemas).map(([name, fields]) => [name, objectSchema(fields)]),
);

function parse(
  schemas: ReadonlyMap<string, z.ZodType>,
  name: string,
  input: unknown,
  unknownOperation: string,
) {
  const schema = schemas.get(name);
  if (!schema)
    throw new DomainError('VALIDATION', 'operation: ' + unknownOperation, 'operation');
  const result = schema.safeParse(input);
  if (result.success) return result.data as Record<string, unknown>;

  const issue = result.error.issues[0]!;
  const path =
    issue.code === 'unrecognized_keys' ? [...issue.path, issue.keys[0]!] : issue.path;
  let field = name;
  let value = input;

  for (const segment of path) {
    field += typeof segment === 'number' ? '[' + segment + ']' : '.' + String(segment);
    value = value && typeof value === 'object' ? Reflect.get(value, segment) : undefined;
  }

  const message =
    issue.code === 'unrecognized_keys'
      ? 'неизвестное поле'
      : value == null && path.length > 0
        ? 'обязательное поле'
        : /[А-Яа-яЁё]/.test(issue.message)
          ? issue.message
          : 'некорректное значение';

  throw new DomainError('VALIDATION', field + ': ' + message, field);
}

export function parseCommandInput<N extends CommandName>(
  name: N,
  input: unknown,
): CommandInput<N> {
  return parse(commands, name, input, 'неизвестная команда') as CommandInput<N>;
}

export function parseQueryInput<N extends QueryName>(
  name: N,
  input: unknown,
): QueryInput<N> {
  return parse(queries, name, input, 'неизвестный запрос') as QueryInput<N>;
}
