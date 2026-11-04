export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type UserStatus = 'PENDING' | 'ACTIVE' | 'DISABLED' | 'DELETED';
export type MemberStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
export type ConversationType = 'DIRECT' | 'GROUP' | 'CHANNEL';
export type ConversationVisibility = 'PUBLIC' | 'PRIVATE';
export type MessageStatus = 'SENT' | 'EDITED' | 'DELETED';
export type FileStatus = 'PENDING' | 'READY' | 'QUARANTINED' | 'DELETED';
export type CallMode = 'AUDIO' | 'VIDEO';
export type CallStatus = 'RINGING' | 'ACTIVE' | 'ENDED' | 'FAILED';
export interface SearchInput {
  readonly workspaceId: string;
  readonly text: string;
  readonly types?: Array<string>;
  readonly conversationIds?: Array<string> | null;
  readonly from?: string | null;
  readonly to?: string | null;
}
export interface AuditFilterInput {
  readonly workspaceId: string;
  readonly actorId?: string | null;
  readonly actions?: Array<string> | null;
  readonly targetType?: string | null;
  readonly from?: string | null;
  readonly to?: string | null;
}
export type SortDirection = 'ASC' | 'DESC';
export type ConversationStatus = 'ACTIVE' | 'ARCHIVED';
export type MessageSortField = 'SEQUENCE' | 'SENT_AT' | 'ID';
export type ConversationSortField = 'ID' | 'TITLE' | 'TYPE';
export type MemberSortField = 'ID' | 'JOINED_AT';
export type EventSortField = 'ID' | 'CREATED_AT';
export type SearchSortField = 'ID' | 'TITLE';
export interface MessageSort {
  readonly field?: MessageSortField | null;
  readonly direction?: SortDirection | null;
}
export interface ConversationSort {
  readonly field?: ConversationSortField | null;
  readonly direction?: SortDirection | null;
}
export interface MemberSort {
  readonly field?: MemberSortField | null;
  readonly direction?: SortDirection | null;
}
export interface EventSort {
  readonly field?: EventSortField | null;
  readonly direction?: SortDirection | null;
}
export interface SearchSort {
  readonly field?: SearchSortField | null;
  readonly direction?: SortDirection | null;
}
export interface MessageFilter {
  readonly text?: string | null;
  readonly senderId?: string | null;
  readonly status?: MessageStatus | null;
  readonly from?: string | null;
  readonly to?: string | null;
}
export interface ConversationFilter {
  readonly text?: string | null;
  readonly type?: ConversationType | null;
  readonly visibility?: ConversationVisibility | null;
  readonly status?: ConversationStatus | null;
}
export interface MembershipFilter {
  readonly status?: MemberStatus | null;
  readonly roleId?: string | null;
  readonly userId?: string | null;
}
export interface NotificationFilter {
  readonly type?: string | null;
  readonly from?: string | null;
  readonly to?: string | null;
}
export interface InviteMemberInput {
  readonly workspaceId: string;
  readonly userId: string;
  readonly roleId: string;
  readonly expiresAt: string;
  readonly idempotencyKey: string;
}
export interface UpdateProfileInput {
  readonly displayName?: string | null;
  readonly avatarFileId?: string | null;
  readonly expectedVersion: string;
  readonly idempotencyKey: string;
}
export interface CreateWorkspaceInput {
  readonly name: string;
  readonly slug: string;
  readonly idempotencyKey: string;
}
export interface ChangeMemberRoleInput {
  readonly workspaceId: string;
  readonly membershipId: string;
  readonly roleId: string;
  readonly expectedVersion: string;
  readonly actionId: string;
}
export interface UpdateWorkspacePolicyInput {
  readonly workspaceId: string;
  readonly mfaRequired?: boolean | null;
  readonly retentionDays?: number | null;
  readonly guestPolicy?: JsonValue | null;
  readonly fileRules?: JsonValue | null;
  readonly channelRules?: JsonValue | null;
  readonly expectedVersion: string;
  readonly actionId: string;
}
export interface CreateConversationInput {
  readonly workspaceId: string;
  readonly type: ConversationType;
  readonly title?: string | null;
  readonly visibility: ConversationVisibility;
  readonly memberIds: Array<string>;
  readonly idempotencyKey: string;
}
export interface SendMessageInput {
  readonly conversationId: string;
  readonly clientMessageId: string;
  readonly body: string;
  readonly threadRootId?: string | null;
  readonly fileIds?: Array<string>;
}
export interface UpdateConversationInput {
  readonly conversationId: string;
  readonly title: string;
  readonly expectedVersion: string;
  readonly idempotencyKey: string;
}
export interface EditMessageInput {
  readonly messageId: string;
  readonly body: string;
  readonly expectedVersion: string;
  readonly idempotencyKey: string;
}
export interface MarkReadInput {
  readonly conversationId: string;
  readonly sequence: string;
}
export interface SetReactionInput {
  readonly messageId: string;
  readonly emoji: string;
  readonly active: boolean;
}
export interface StartCallInput {
  readonly conversationId: string;
  readonly mode: CallMode;
  readonly inviteeIds?: Array<string>;
  readonly idempotencyKey: string;
}
