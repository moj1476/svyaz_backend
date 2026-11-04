import type { UserStatus } from '../inputs';

export interface User {
  id: string;
  login: string;
  displayName: string;
  status: UserStatus;
  avatarFileId: string | null;
  version: string;
}

export interface Device {
  id: string;
  platform: string;
  name: string;
  trusted: boolean;
  lastSeenAt: string;
}

export interface Session {
  id: string;
  userId: string;
  deviceId: string | null;
  status: string;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
}

export interface IdentityData {
  users: User[];
  devices: Device[];
  sessions: Session[];
}
