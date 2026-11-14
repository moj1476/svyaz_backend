import type { GraphQLScalarType } from 'graphql';
import type { QueryResolvers, MutationResolvers } from '#contracts/graphql-types';
import { mutationOwners } from '#contracts/commands';
import type { Composition } from '../application/composition';
import type { GraphQLContext } from '../context/create-context';
import type { Resolver } from './resolvers/types';
import { authFields } from './resolvers/auth';
import { workspaceFields } from './resolvers/workspace';
import { identityFields } from './resolvers/identity';
import { messagingFields } from './resolvers/messaging';
import { filesFields } from './resolvers/files';
import { callsFields } from './resolvers/calls';
import { scalars } from './scalars';
import { expose } from './errors';

export type GatewayResolver = (
  parent: Parameters<Resolver>[0],
  args: Parameters<Resolver>[1],
  context: GraphQLContext,
) => Promise<unknown>;

export function resolvers(composition: Composition, businessApi: boolean) {
  const Query: Record<string, GatewayResolver> = {};
  const auth = authFields(composition);
  const protect =
    (resolver: Resolver): GatewayResolver =>
    (p, a, c) =>
      expose(async () => resolver(p, a, await c.authenticated()), c);
  Query.viewer = protect((_p, _a, c) => auth.viewer(c));

  const queryNames = [
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
    ...(businessApi ? (['conversationStats'] as const) : []),
  ] satisfies (keyof QueryResolvers)[];

  for (const name of queryNames)
    Query[name] = protect((_p, a, c) => composition.query(name, a, c));

  const Mutation: Record<string, GatewayResolver> = {
    login: (p, a, c) => expose(() => auth.login(p, a, c), c),
    register: (p, a, c) => expose(() => auth.register(p, a, c), c),
    logout: (p, a, c) => expose(() => auth.logout(p, a, c), c),
  };
  if (businessApi) {
    for (const name of Object.keys(mutationOwners) as (keyof MutationResolvers)[]) {
      const secured = protect((_p, a, c) => composition.mutate(name, a, c));
      Mutation[name] = (p, a, c) => {
        c.invalidate();
        return secured(p, a, c);
      };
    }
  }

  const result: Record<string, GraphQLScalarType | Record<string, GatewayResolver>> = {
    Query,
    Mutation,
    ...scalars,
  };
  const fields = {
    ...workspaceFields(composition.data),
    ...identityFields(composition.data),
    ...messagingFields(composition.data, composition.clients),
    ...filesFields(composition.data),
    ...callsFields(composition.data),
  };
  for (const [type, resolvers] of Object.entries(fields)) {
    result[type] = Object.fromEntries(
      Object.entries(resolvers).map(([name, resolver]) => [name, protect(resolver)]),
    );
  }
  return result;
}
