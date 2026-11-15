import {
  services,
  type Clients,
  type DataMap,
  type RequestContext,
  type ServiceClient,
  type ServiceName,
} from '#contracts';
import type { WorkspaceRole } from '#contracts/auth';
import type { SearchDocument } from '#contracts';
import type { AuthService } from '#apps/identity/src/application/auth/service';
import { connect, decode, encode } from './transport';

type Auth = Pick<AuthService, 'login' | 'register' | 'authenticate' | 'logout'>;

export function requestContext({
  userId,
  requestId,
  sessionId,
  workspaceRoles,
}: RequestContext) {
  return { userId, requestId, sessionId, workspaceRoles };
}

export function createGrpcClients() {
  const channels = new Map(services.map((name) => [name, connect(name)]));
  const identity = channels.get('identity')!;
  const workspace = channels.get('workspace')!;
  const messaging = channels.get('messaging')!;
  function stub<K extends ServiceName>(name: K): ServiceClient<K> {
    const channel = channels.get(name)!;
    return {
      snapshot: (context) =>
        json<DataMap[K]>(channel, 'snapshot', requestContext(context)),
      execute: channel.supports('execute')
        ? (operation, input, context) =>
            json(channel, 'execute', {
              name: operation,
              inputJson: encode(input),
              context: requestContext(context),
            })
        : undefined,
      query: channel.supports('query')
        ? (operation, input, context) =>
            json(channel, 'query', {
              name: operation,
              inputJson: encode(input),
              context: requestContext(context),
            })
        : undefined,
      statistics: channel.supports('statistics')
        ? (workspaceId, context) =>
            json(channel, 'statistics', { workspaceId, context: requestContext(context) })
        : undefined,
      userExists: channel.supports('userExists')
        ? async (id) =>
            (await channel.call<{ value?: boolean }>('userExists', { id })).value ?? false
        : undefined,
      recordingUsesFile: channel.supports('recordingUsesFile')
        ? async (id) =>
            (await channel.call<{ value?: boolean }>('recordingUsesFile', { id }))
              .value ?? false
        : undefined,
    };
  }

  const auth: Auth = {
    login: (input, ip) => json(identity, 'login', { inputJson: encode(input), ip }),
    register: (input, ip) => json(identity, 'register', { inputJson: encode(input), ip }),
    authenticate: (authorization, requestId) =>
      identity.call('authenticate', { authorization, requestId }),
    logout: async (userId, sessionId) =>
      (await identity.call<{ value: true }>('logout', { userId, sessionId })).value,
  };
  return {
    clients: Object.fromEntries(services.map((name) => [name, stub(name)])) as Clients,
    auth,
    activeMembers: async (id: string) =>
      (await workspace.call<{ ids: string[] }>('activeMembers', { id })).ids,
    messageRecipients: async (id: string) =>
      (await messaging.call<{ ids: string[] }>('messageRecipients', { id })).ids,
    rolesForUser: async (id: string) =>
      (await workspace.call<{ roles: WorkspaceRole[] }>('rolesForUser', { id })).roles,
    async searchProjection(
      type: string,
      id: string,
      occurredAt: string,
    ): Promise<SearchDocument | null> {
      const { document } = await messaging.call<{
        document?: Omit<SearchDocument, 'sourceId'>;
      }>('searchProjection', { type, id, occurredAt });
      return document
        ? { ...document, sourceId: document.id, snippet: document.snippet ?? null }
        : null;
    },
    close: () => channels.forEach((channel) => channel.close()),
  };
}

async function json<T>(
  channel: ReturnType<typeof connect>,
  method: string,
  request: object,
) {
  const result = await channel.call<{ dataJson: Buffer }>(method, request);
  return decode<T>(result.dataJson);
}
