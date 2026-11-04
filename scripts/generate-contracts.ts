import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parse,
  print,
  Kind,
  valueFromASTUntyped,
  type TypeNode,
  type InputValueDefinitionNode,
} from 'graphql';
import { format, resolveConfig } from 'prettier';
import { backendRoot } from '../packages/config/src';
import { mutationOwners } from '../packages/contracts/src/ownership';

const scalarTypes: Record<string, string> = {
  ID: 'string',
  String: 'string',
  Long: 'string',
  DateTime: 'string',
  Int: 'number',
  Float: 'number',
  Boolean: 'boolean',
  JSON: 'JsonValue',
};

function core(type: TypeNode): string {
  if (type.kind === Kind.NON_NULL_TYPE) return core(type.type);

  if (type.kind === Kind.LIST_TYPE) return `Array<${typescript(type.type)}>`;

  return scalarTypes[type.name.value] ?? type.name.value;
}

function typescript(type: TypeNode): string {
  return type.kind === Kind.NON_NULL_TYPE ? core(type.type) : core(type) + ' | null';
}

function field(node: InputValueDefinitionNode): string {
  return `readonly ${node.name.value}${node.type.kind === Kind.NON_NULL_TYPE && !node.defaultValue ? '' : '?'}: ${typescript(node.type)};`;
}

function wireFields(nodes: readonly InputValueDefinitionNode[] = []) {
  return Object.fromEntries(
    nodes.map((node) => [
      node.name.value,
      {
        type: print(node.type),
        ...(node.defaultValue
          ? { default: valueFromASTUntyped(node.defaultValue) as unknown }
          : {}),
      },
    ]),
  );
}

const entities: Record<string, readonly [string, string]> = {
  UserPayload: ['user', 'User'],
  SessionPayload: ['session', 'Session'],
  WorkspacePayload: ['workspace', 'Workspace'],
  MembershipPayload: ['membership', 'Membership'],
  TeamPayload: ['team', 'Team'],
  PolicyPayload: ['policy', 'Policy'],
  ConversationPayload: ['conversation', 'Conversation'],
  MessagePayload: ['message', 'Message'],
  NotificationPayload: ['notification', 'Notification'],
  CallPayload: ['call', 'Call'],
  FilePayload: ['file', 'FileRecord'],
  InvitationPayload: ['invitation', 'Invitation'],
  ReadStatePayload: ['readState', 'ReadState'],
};

async function main() {
  const root = backendRoot(),
    schema = parse(readFileSync(resolve(root, 'contracts/graphql/lab4.graphql'), 'utf8'));

  let inputs =
    'export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };\n';

  const objects: Record<string, ReturnType<typeof wireFields>> = {},
    enums: Record<string, string[]> = {};

  for (const definition of schema.definitions) {
    if (definition.kind === Kind.ENUM_TYPE_DEFINITION) {
      const values = definition.values?.map((value) => value.name.value) ?? [];

      inputs += `export type ${definition.name.value} = ${values.map((value) => JSON.stringify(value)).join(' | ')};\n`;
      enums[definition.name.value] = values;
    }

    if (definition.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION) {
      inputs += `export interface ${definition.name.value} {\n${definition.fields?.map(field).join('\n') ?? ''}\n}\n`;
      objects[definition.name.value] = wireFields(definition.fields);
    }
  }

  const mutation = schema.definitions.find(
    (definition) =>
      definition.kind === Kind.OBJECT_TYPE_DEFINITION &&
      definition.name.value === 'Mutation',
  );

  if (mutation?.kind !== Kind.OBJECT_TYPE_DEFINITION)
    throw new Error('В схеме отсутствует тип Mutation');

  let commands = `import type { User, Session, Workspace, Membership, Team, Policy, Conversation, Message, Notification, Call, FileRecord, WorkspaceData, RequestContext, ServiceName } from './index';
import type * as Input from './inputs';
import { mutationOwners } from './ownership';
export { mutationOwners } from './ownership';
export type Invitation = NonNullable<WorkspaceData['invitations']>[number];
export interface ReadState { conversationId: string; sequence: string; }
export interface OperationError {code: string; message: string; field: string | null; retryable: boolean;}
export interface CommandDefinitions {\n`;

  const commandSchemas: Record<string, ReturnType<typeof wireFields>> = {};

  for (const command of mutation.fields ?? []) {
    const name = command.name.value;

    if (!Object.hasOwn(mutationOwners, name))
      throw new Error(`Не указан сервис операции: ${name}`);

    const args = command.arguments ?? [],
      single = args.length === 1 && args[0]?.name.value === 'input',
      argument = args[0];

    const input =
      single && argument
        ? 'Input.' + core(argument.type)
        : '{' + args.map(field).join('\n') + '}';

    const entity = entities[core(command.type)];

    if (!entity) throw new Error(`Отсутствует соответствие результата операции: ${name}`);

    commands += `${name}: { input: ${input}; output: {${entity[0]}: ${entity[1]}} };\n`;
    commandSchemas[name] =
      single && argument ? (objects[core(argument.type)] ?? {}) : wireFields(args);
  }

  commands += `}
export type CommandName = keyof CommandDefinitions;
export type CommandInput<N extends CommandName> = CommandDefinitions[N]['input'];
export type CommandOutput<N extends CommandName> = CommandDefinitions[N]['output'];
export type CommandResult<N extends CommandName> = CommandOutput<N> & { errors: OperationError[]; idempotencyKey: string | null };
export type ServiceCommand<S extends ServiceName> = { [N in CommandName]: typeof mutationOwners[N] extends S ? N : never }[CommandName];
export function isCommandName(name: string): name is CommandName { return Object.hasOwn(mutationOwners, name); }
export interface CommandClient {execute<N extends CommandName>(operation: N, input: CommandInput<N>, context: RequestContext): Promise<CommandResult<N>>;}
`;

  const names = [
    'members',
    'conversations',
    'messages',
    'thread',
    'notifications',
    'search',
    'auditEvents',
    'conversationStats',
  ];

  const query = schema.definitions.find(
    (definition) =>
      definition.kind === Kind.OBJECT_TYPE_DEFINITION &&
      definition.name.value === 'Query',
  );

  if (query?.kind !== Kind.OBJECT_TYPE_DEFINITION)
    throw new Error('В схеме отсутствует тип Query');

  const querySchemas = Object.fromEntries(
    (query.fields ?? [])
      .filter((query) => names.includes(query.name.value))
      .map((query) => [query.name.value, wireFields(query.arguments)]),
  );

  querySchemas.messageReactions = { messageId: { type: 'ID!' } };

  const runtime = `export interface FieldSchema { type: string; default?: unknown; }
export const inputObjects: Record<string, Record<string, FieldSchema>> = ${JSON.stringify(objects)};
export const enumValues: Record<string, readonly string[]> = ${JSON.stringify(enums)};
export const commandSchemas: Record<string, Record<string, FieldSchema>> = ${JSON.stringify(commandSchemas)};
export const querySchemas: Record<string, Record<string, FieldSchema>> = ${JSON.stringify(querySchemas)};\n`;

  const config = await resolveConfig(resolve(root, '.prettierrc.json'));

  for (const [name, text] of Object.entries({
    'inputs.ts': inputs,
    'command-map.ts': commands,
    'input-schema.ts': runtime,
  })) {
    writeFileSync(
      resolve(root, 'packages/contracts/src', name),
      await format(text, { ...config, parser: 'typescript' }),
    );
  }

  console.log('Typed DTOs and runtime wire schemas generated');
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Не удалось сгенерировать контракты',
  );
  process.exitCode = 1;
});
