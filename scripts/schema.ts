import { buildSchema, extendSchema, Kind, parse, print, validateSchema } from 'graphql';
import { readFileSync, writeFileSync } from 'node:fs';

for (const name of ['lab2-reference', 'svyaz-read']) {
  const errors = validateSchema(
    buildSchema(readFileSync(`contracts/graphql/${name}.graphql`, 'utf8')),
  );

  if (errors.length) throw new Error('Схема GraphQL некорректна', { cause: errors });

  console.log(`${name} schema valid`);
}

const auth = parse(readFileSync('contracts/graphql/auth.graphql', 'utf8'));
const readSchema = buildSchema(
  readFileSync('contracts/graphql/svyaz-read.graphql', 'utf8'),
);
if (validateSchema(extendSchema(readSchema, auth)).length)
  throw new Error('Схема GraphQL для чтения с аутентификацией некорректна');

const base = parse(readFileSync('contracts/graphql/svyaz-read.graphql', 'utf8'));

const extension = parse(
  readFileSync('contracts/graphql/lab4-extensions.graphql', 'utf8'),
);

const query = base.definitions.find(
  (d) => d.kind === Kind.OBJECT_TYPE_DEFINITION && d.name.value === 'Query',
);

const additions = extension.definitions.find(
  (d) => d.kind === Kind.OBJECT_TYPE_EXTENSION && d.name.value === 'Query',
);

if (
  query?.kind !== Kind.OBJECT_TYPE_DEFINITION ||
  additions?.kind !== Kind.OBJECT_TYPE_EXTENSION
)
  throw new Error('В схеме отсутствует тип Query');

const fields = [...(query.fields ?? [])];

for (const field of additions.fields ?? []) {
  const i = fields.findIndex((f) => f.name.value === field.name.value);

  if (i < 0) fields.push(field);
  else
    fields[i] = {
      ...fields[i]!,
      arguments: [...(fields[i]!.arguments ?? []), ...(field.arguments ?? [])],
    };
}

const definitions = base.definitions
  .map((d) => (d === query ? { ...query, fields } : d))
  .concat(
    extension.definitions.filter((d) => d !== additions) as typeof base.definitions,
  );

const text = print({ ...base, definitions });

const errors = validateSchema(
  extendSchema(buildSchema(text), {
    ...auth,
    definitions: auth.definitions.map((definition) =>
      definition.kind === Kind.OBJECT_TYPE_DEFINITION &&
      definition.name.value === 'Mutation'
        ? { ...definition, kind: Kind.OBJECT_TYPE_EXTENSION }
        : definition,
    ),
  }),
);

if (errors.length) throw new Error('Схема GraphQL некорректна', { cause: errors });

writeFileSync('contracts/graphql/lab4.graphql', text + '\n');

console.log('Lab4 schema valid');
