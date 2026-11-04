import type { MemberStatus } from '../inputs';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  status: string;
  version: string;
}

export interface Membership {
  id: string;
  workspaceId: string;
  userId: string;
  roleId: string;
  status: MemberStatus;
  joinedAt: string;
  version: string;
}

export interface Role {
  id: string;
  workspaceId: string;
  code: string;
  name: string;
  systemRole: boolean;
  version: string;
  permissionIds: string[];
}

export interface Permission {
  id: string;
  code: string;
  scope: string;
}

export interface Team {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: string;
  membershipIds: string[];
}

export interface Policy {
  workspaceId: string;
  mfaRequired: boolean;
  guestPolicy: object;
  retentionDays: number;
  fileRules: object;
  channelRules: object;
  version: string;
}

export interface WorkspaceData {
  invitations?: {
    id: string;
    workspaceId: string;
    userId: string;
    roleId: string;
    status: string;
    expiresAt: string;
    createdAt: string;
  }[];
  workspaces: Workspace[];
  memberships: Membership[];
  roles: Role[];
  permissions: Permission[];
  teams: Team[];
  policies: Policy[];
}
