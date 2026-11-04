import type {
  CallsData,
  FilesData,
  MessagingData,
  ServiceName,
  WorkspaceData,
} from './index';

export interface WorkspaceStatistics {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
}

export interface MessagingStatistics {
  channelCount: number;
  messagesLast30Days: string;
}

export interface FileStatistics {
  storageUsed: string;
  storageLimit: null;
}

export interface CallStatistics {
  callsLast30Days: string;
}

interface StatisticsMap {
  workspace: WorkspaceStatistics;
  messaging: MessagingStatistics;
  files: FileStatistics;
  calls: CallStatistics;
}

export type ServiceStatistics<S extends ServiceName> = S extends keyof StatisticsMap
  ? StatisticsMap[S]
  : never;

export type StoredStatistics<T> = T extends WorkspaceData
  ? WorkspaceStatistics
  : T extends MessagingData
    ? MessagingStatistics
    : T extends FilesData
      ? FileStatistics
      : T extends CallsData
        ? CallStatistics
        : never;

export interface Dashboard {
  workspaceId: string;
  totalMembers: number | null;
  activeMembers: number | null;
  pendingInvites: number | null;
  channelCount: number | null;
  storageUsed: string | null;
  storageLimit: null;
  messagesLast30Days: string | null;
  callsLast30Days: string | null;
  degradedServices: ServiceName[];
}
