import type { Clients } from '#contracts';
import type { Dashboard } from '#contracts/statistics';
import { DomainError } from '#contracts/errors';
import type { QueryContext } from '../../context/query-context';
import type { Access } from '../access';
export async function dashboard(
  clients: Clients,
  access: Access,
  context: QueryContext,
  workspaceId: string,
) {
  await access.permission(context, workspaceId, 'workspace.dashboard.read');

  const result: Dashboard = {
    workspaceId,
    totalMembers: null,
    activeMembers: null,
    pendingInvites: null,
    channelCount: null,
    storageUsed: null,
    storageLimit: null,
    messagesLast30Days: null,
    callsLast30Days: null,
    degradedServices: [],
  };

  const degradedServices: Dashboard['degradedServices'] = [];

  for (const owner of ['workspace', 'messaging', 'files', 'calls'] as const) {
    try {
      const client = clients[owner];

      if (!client.statistics) throw new Error('Обработчик сводных данных отсутствует');

      Object.assign(result, await client.statistics(workspaceId, context));
    } catch (error) {
      if (error instanceof DomainError && error.code === 'FORBIDDEN') throw error;

      degradedServices.push(owner);
    }
  }

  return { ...result, degradedServices };
}
