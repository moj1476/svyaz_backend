import { randomUUID } from 'node:crypto';
import { createMockClients } from '../../../adapters/mocks/clients';
import { required } from '../../../packages/config/src';
import type { DataMap } from '../../../packages/contracts/src';
import { labData } from '../../../packages/lab-data/src';

export const LOCAL_RUNTIME = Symbol('LOCAL_RUNTIME');

export function createLocalRuntime(businessApi: boolean) {
  const data = businessApi ? createEmptyData() : labData;
  return { clients: createMockClients(data), users: data.identity.users };
}

function createEmptyData(): DataMap {
  const logins = new Set(
    required('LOCAL_USER_LOGINS')
      .split(',')
      .map((login) => login.trim())
      .filter(Boolean),
  );

  if (!logins.size) throw new Error('Укажите хотя бы один логин в LOCAL_USER_LOGINS');

  return {
    identity: {
      users: [...logins].map((login) => ({
        id: randomUUID(),
        login,
        displayName: login,
        status: 'ACTIVE',
        avatarFileId: null,
        version: '1',
      })),
      devices: [],
      sessions: [],
    },
    workspace: {
      workspaces: [],
      memberships: [],
      roles: [],
      teams: [],
      policies: [],
      permissions: [
        { id: randomUUID(), code: 'audit.read', scope: 'AUDIT' },
        { id: randomUUID(), code: 'workspace.members.read', scope: 'WORKSPACE' },
        { id: randomUUID(), code: 'workspace.dashboard.read', scope: 'WORKSPACE' },
      ],
    },
    messaging: {
      conversations: [],
      conversationMembers: [],
      messages: [],
      reactions: [],
    },
    files: { files: [], attachments: [] },
    notifications: { notifications: [] },
    calls: { calls: [], participants: [], recordings: [] },
    audit: { events: [] },
    presence: { presence: [] },
    search: { documents: [] },
  };
}
