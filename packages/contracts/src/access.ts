import { DomainError } from './errors';
import type {
  Membership,
  Permission,
  RequestContext,
  Role,
  SearchDocument,
} from './index';

export interface AccessClient {
  conversationActive(context: RequestContext, conversationId: string): Promise<boolean>;
  userExists(userId: string, context?: RequestContext): Promise<boolean>;
  conversationWorkspace(context: RequestContext, conversationId: string): Promise<string>;
  workspaceIds(context: RequestContext): Promise<string[]>;
  permission(
    context: RequestContext,
    workspaceId: string,
    code: string,
  ): Promise<boolean>;
  conversationIds(context: RequestContext): Promise<string[]>;
  visibleUserIds(context: RequestContext): Promise<string[]>;
  messageIds(context: RequestContext): Promise<string[]>;
  recordingFileIds(context: RequestContext): Promise<string[]>;
  searchDocument(context: RequestContext, document: SearchDocument): Promise<boolean>;
}

export function requireWorkspace(ids: string[], workspaceId: string) {
  if (!ids.includes(workspaceId))
    throw new DomainError('FORBIDDEN', 'Нет доступа к рабочему пространству');
}

export function hasPermission(
  memberships: Membership[],
  roles: Role[],
  permissions: Permission[],
  userId: string,
  workspaceId: string,
  code: string,
) {
  const membership = memberships.find(
    (m) => m.userId === userId && m.workspaceId === workspaceId && m.status === 'ACTIVE',
  );

  const role = roles.find((r) => r.id === membership?.roleId);

  return permissions.some((p) => p.code === code && role?.permissionIds.includes(p.id));
}
