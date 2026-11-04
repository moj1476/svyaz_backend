import { StubDirectory } from './stub-directory';
import type { ReadRepository } from '../../packages/contracts/src';
import type { TransactionStore } from '../../packages/contracts/src/commands';
import { ReadService as Audit } from '../../apps/audit/src/application';
import { BusinessService as Calls } from '../../apps/calls/src/operations';
import { BusinessService as Files } from '../../apps/files/src/operations';
import { BusinessService as Identity } from '../../apps/identity/src/operations';
import { BusinessService as Messaging } from '../../apps/messaging/src/operations';
import { BusinessService as Notification } from '../../apps/notifications/src/operations';
import { ReadService as Presence } from '../../apps/presence/src/application';
import { ReadService as Search } from '../../apps/search/src/application';
import { BusinessService as Workspace } from '../../apps/workspace/src/operations';
import type { Clients, DataMap } from '../../packages/contracts/src';
import { labData } from '../../packages/lab-data/src';
import { MemoryStore } from './memory-store';

export type LocalStores = {
  [K in keyof DataMap]: K extends 'audit' | 'presence' | 'search'
    ? ReadRepository<DataMap[K]>
    : TransactionStore<DataMap[K]>;
};

export function createMockClients(): Clients {
  const stores = {
    identity: new MemoryStore(labData.identity),
    workspace: new MemoryStore(labData.workspace),
    messaging: new MemoryStore(labData.messaging),
    files: new MemoryStore(labData.files),
    notifications: new MemoryStore(labData.notifications),
    calls: new MemoryStore(labData.calls),
    audit: new MemoryStore(labData.audit),
    presence: new MemoryStore(labData.presence),
    search: new MemoryStore(labData.search),
  } satisfies { [K in keyof DataMap]: MemoryStore<DataMap[K]> };

  return composeClients(stores);
}

export function composeClients(stores: LocalStores): Clients {
  const access = new StubDirectory(() => clients);
  const clients: Clients = {
    identity: new Identity(stores.identity, access),
    workspace: new Workspace(stores.workspace, access),
    messaging: new Messaging(stores.messaging, access),
    files: new Files(stores.files, access),
    notifications: new Notification(stores.notifications, access),
    calls: new Calls(stores.calls, access),
    audit: new Audit(stores.audit, access),
    presence: new Presence(stores.presence, access),
    search: new Search(stores.search, access),
  };

  return clients;
}
