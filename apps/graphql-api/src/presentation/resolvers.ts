import type { GraphQLScalarType } from 'graphql';
import { mutationOwners } from '../../../../packages/contracts/src/commands';
import type { Composition } from '../application/composition';
import type { Resolver } from './resolvers/types';
import { workspaceFields } from './resolvers/workspace';
import { identityFields } from './resolvers/identity';
import { messagingFields } from './resolvers/messaging';
import { filesFields } from './resolvers/files';
import { callsFields } from './resolvers/calls';
import { scalars } from './scalars';
import { expose } from './errors';

export function resolvers(composition: Composition, businessApi: boolean) {
  const Query: Record<string, Resolver> = {};

  for (const name of [
    'me',
    'sessions',
    'workspaces',
    'workspace',
    'members',
    'roles',
    'teams',
    'conversations',
    'conversation',
    'messages',
    'thread',
    'file',
    'notifications',
    'presence',
    'call',
    'activeCall',
    'search',
    'auditEvents',
    'adminDashboard',
    ...(businessApi ? ['conversationStats'] : []),
  ])
    Query[name] = (_p, a, c) => expose(() => composition.query(name, a, c), c);

  const result: Record<string, GraphQLScalarType | Record<string, Resolver>> = {
    Query,
    ...scalars,
  };

  const Mutation: Record<string, Resolver> = {};

  for (const name of Object.keys(mutationOwners))
    Mutation[name] = (_p, a, c) => expose(() => composition.mutate(name, a, c), c);

  if (businessApi) result.Mutation = Mutation;

  const fields = {
    ...workspaceFields(composition.data),
    ...identityFields(composition.data),
    ...messagingFields(composition.data, composition.clients),
    ...filesFields(composition.data),
    ...callsFields(composition.data),
  };
  for (const [type, resolvers] of Object.entries(fields)) {
    result[type] = Object.fromEntries(
      Object.entries(resolvers).map(([name, resolver]) => [
        name,
        (p, a, c) => expose(() => resolver(p, a, c), c),
      ]),
    );
  }
  return result;
}
