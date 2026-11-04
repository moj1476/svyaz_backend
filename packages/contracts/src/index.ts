export type { User, Device, Session, IdentityData } from './models/identity';

import type { IdentityData } from './models/identity';

export type {
  Workspace,
  Membership,
  Role,
  Permission,
  Team,
  Policy,
  WorkspaceData,
} from './models/workspace';

import type { WorkspaceData } from './models/workspace';

export type {
  Conversation,
  ConversationMember,
  Message,
  Reaction,
  MessagingData,
} from './models/messaging';

import type { MessagingData } from './models/messaging';

export type { FileRecord, Attachment, FilesData } from './models/files';

import type { FilesData } from './models/files';

export type { Notification, NotificationsData } from './models/notifications';

import type { NotificationsData } from './models/notifications';

export type { Call, CallParticipant, Recording, CallsData } from './models/calls';

import type { CallsData } from './models/calls';

export type { AuditEvent, AuditData } from './models/audit';

import type { AuditData } from './models/audit';

export type { Presence, PresenceData } from './models/presence';

import type { PresenceData } from './models/presence';

export type { SearchDocument, SearchData } from './models/search';

import type { SearchData } from './models/search';

export type ServiceName =
  | 'identity'
  | 'workspace'
  | 'messaging'
  | 'files'
  | 'notifications'
  | 'calls'
  | 'audit'
  | 'presence'
  | 'search';

export const services: ServiceName[] = [
  'identity',
  'workspace',
  'messaging',
  'files',
  'notifications',
  'calls',
  'audit',
  'presence',
  'search',
];

export const sqlServices = services.filter((s) => s !== 'presence' && s !== 'search');

export interface RequestContext {
  userId: string;
  requestId: string;
}

export interface DataMap {
  identity: IdentityData;
  workspace: WorkspaceData;
  messaging: MessagingData;
  files: FilesData;
  notifications: NotificationsData;
  calls: CallsData;
  audit: AuditData;
  presence: PresenceData;
  search: SearchData;
}

export interface ServiceClient<K extends ServiceName> {
  snapshot(context: RequestContext): Promise<DataMap[K]>;
  execute?<N extends import('./command-map').ServiceCommand<K>>(
    operation: N,
    input: import('./command-map').CommandInput<N>,
    context: RequestContext,
  ): Promise<import('./command-map').CommandResult<N>>;
  query?<N extends import('./queries').ServiceQuery<K>>(
    operation: N,
    input: import('./queries').QueryInput<N>,
    context: RequestContext,
  ): Promise<import('./queries').QueryOutput<N>>;
  statistics?(
    workspaceId: string,
    context: RequestContext,
  ): Promise<import('./statistics').ServiceStatistics<K>>;
  userExists?(userId: string): Promise<boolean>;
  recordingUsesFile?(fileId: string): Promise<boolean>;
}

export interface ReadRepository<T> {
  load(scope?: import('./read-scope').ReadScope): Promise<T>;
  close(): Promise<void>;
}

export type Clients = { [K in ServiceName]: ServiceClient<K> };

export const CLIENTS = Symbol('SERVICE_CLIENTS');
