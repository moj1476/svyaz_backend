import type { Membership, Role } from './models/workspace';

export interface WorkspaceRole {
  workspaceId: Membership['workspaceId'];
  roleId: Role['id'];
  code: Role['code'];
}

export interface AuthenticatedSession {
  sessionId: string;
  workspaceRoles: readonly WorkspaceRole[];
}
