import type { Clients } from '../../../../packages/contracts/src';
import { queryClient } from '../../../../packages/runtime/src/client-dispatch';
import { queryOwners } from '../../../../packages/contracts/src/commands';
import { DomainError, uuid } from '../../../../packages/contracts/src/errors';
import { connection, type PageArgs } from '../../../../packages/contracts/src/pagination';
import { parseQueryInput } from '../../../../packages/contracts/src/parse-input';
import { isQueryName } from '../../../../packages/contracts/src/queries';
import { normalizeInput } from '../../../../packages/contracts/src/validation';
import type { QueryContext } from '../context/query-context';
import type { RequestData } from '../context/request-data';
import type { Access } from './access';
import { dashboard } from './dashboard/dashboard';
export interface Args extends PageArgs {
  id?: string;
  workspaceId?: string;
  conversationId?: string;
  rootMessageId?: string;
  unreadOnly?: boolean;
  userIds?: string[];
}

interface SearchInput {
  workspaceId: string;
  text: string;
  types: string[];
  conversationIds?: string[];
  from?: string;
  to?: string;
}

interface AuditFilter {
  workspaceId: string;
  actorId?: string;
  actions?: string[];
  targetType?: string;
  from?: string;
  to?: string;
}

export async function query(
  clients: Clients,
  source: RequestData,
  access: Access,
  name: string,
  a: Args & { input?: SearchInput; filter?: AuditFilter },
  context: QueryContext,
): Promise<unknown> {
  a = normalizeInput({ ...a });

  if (isQueryName(name)) {
    const owner = queryOwners[name];

    if (context.failed === owner)
      throw new DomainError('UNAVAILABLE', 'Учебный отказ источника');

    const client = clients[owner];

    if (client.query)
      return queryClient(clients, name, parseQueryInput(name, a), context);
  }

  switch (name) {
    case 'me':
      return source.user(context, context.userId);
    case 'sessions':
      return connection(
        (await source.data('identity', context)).sessions,
        a,
        `sessions:${context.userId}`,
        (s) => s.id,
        20,
      );
    case 'workspaces':
      return (await source.data('workspace', context)).workspaces;
    case 'workspace':
      return access.workspace(context, a.id!);
    case 'roles':
    case 'teams': {
      await access.requireWorkspace(context, a.workspaceId!);

      return (await source.data('workspace', context))[name].filter(
        (candidate) => candidate.workspaceId === a.workspaceId,
      );
    }
    case 'conversation':
      return access.conversation(context, a.id!);
    case 'file':
      uuid(a.id!);
      return (
        (await source.data('files', context)).files.find((f) => f.id === a.id) ?? null
      );
    case 'presence': {
      await access.requireWorkspace(context, a.workspaceId!);

      if (a.userIds!.length > 100)
        throw new DomainError('VALIDATION', 'Не более 100 пользователей');

      a.userIds!.forEach(uuid);

      const data = await source.data('presence', context);

      return data.presence.filter(
        (p) => p.workspaceId === a.workspaceId && a.userIds!.includes(p.userId),
      );
    }
    case 'call':
      uuid(a.id!);
      return (
        (await source.data('calls', context)).calls.find((call) => call.id === a.id) ??
        null
      );
    case 'activeCall':
      await access.requireConversation(context, a.conversationId!);
      return (
        (await source.data('calls', context)).calls.find(
          (call) =>
            call.conversationId === a.conversationId &&
            ['ACTIVE', 'RINGING'].includes(call.status),
        ) ?? null
      );
    case 'adminDashboard':
      return dashboard(clients, access, context, a.workspaceId!);
    default:
      throw new DomainError('VALIDATION', 'Неизвестная операция');
  }
}
