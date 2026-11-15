import type { JsonValue } from './json-value';
import type {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from 'graphql';
import type {
  Workspace as WorkspaceModel,
  Membership as MembershipModel,
  Role as RoleModel,
  Session as SessionModel,
  Device as DeviceModel,
  Conversation as ConversationModel,
  Message as MessageModel,
  Attachment as AttachmentModel,
  FileRecord as FileRecordModel,
  Call as CallModel,
  CallParticipant as CallParticipantModel,
  Recording as RecordingModel,
  User as UserModel,
  Permission as PermissionModel,
  Policy as PolicyModel,
  Team as TeamModel,
} from './index';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: string; output: string };
  JSON: { input: JsonValue; output: JsonValue };
  /** Signed int64 serialized as a decimal string without loss of precision. */
  Long: { input: string; output: string };
};

export type AdminDashboard = {
  __typename?: 'AdminDashboard';
  activeMembers?: Maybe<Scalars['Int']['output']>;
  callsLast30Days?: Maybe<Scalars['Long']['output']>;
  channelCount?: Maybe<Scalars['Int']['output']>;
  degradedServices: Array<Scalars['String']['output']>;
  messagesLast30Days?: Maybe<Scalars['Long']['output']>;
  pendingInvites?: Maybe<Scalars['Int']['output']>;
  storageLimit?: Maybe<Scalars['Long']['output']>;
  storageUsed?: Maybe<Scalars['Long']['output']>;
  totalMembers?: Maybe<Scalars['Int']['output']>;
  workspaceId: Scalars['ID']['output'];
};

export type Attachment = {
  __typename?: 'Attachment';
  file: File;
  id: Scalars['ID']['output'];
  messageId: Scalars['ID']['output'];
};

export type AuditEvent = Node & {
  __typename?: 'AuditEvent';
  action: Scalars['String']['output'];
  actorId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  metadata: Scalars['JSON']['output'];
  occurredAt: Scalars['DateTime']['output'];
  outcome: Scalars['String']['output'];
  targetId?: Maybe<Scalars['ID']['output']>;
  targetType: Scalars['String']['output'];
};

export type AuditEventConnection = {
  __typename?: 'AuditEventConnection';
  edges: Array<AuditEventEdge>;
  pageInfo: PageInfo;
};

export type AuditEventEdge = {
  __typename?: 'AuditEventEdge';
  cursor: Scalars['String']['output'];
  node: AuditEvent;
};

export type AuditFilterInput = {
  actions?: InputMaybe<Array<Scalars['String']['input']>>;
  actorId?: InputMaybe<Scalars['ID']['input']>;
  from?: InputMaybe<Scalars['DateTime']['input']>;
  targetType?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['DateTime']['input']>;
  workspaceId: Scalars['ID']['input'];
};

export type Call = Node & {
  __typename?: 'Call';
  conversationId: Scalars['ID']['output'];
  endedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  mode: CallMode;
  participants: Array<CallParticipant>;
  recordings: Array<Recording>;
  startedAt?: Maybe<Scalars['DateTime']['output']>;
  status: CallStatus;
};

export type CallMode = 'AUDIO' | 'VIDEO';

export type CallParticipant = {
  __typename?: 'CallParticipant';
  joinedAt?: Maybe<Scalars['DateTime']['output']>;
  leftAt?: Maybe<Scalars['DateTime']['output']>;
  status: Scalars['String']['output'];
  user: User;
};

export type CallPayload = {
  __typename?: 'CallPayload';
  call?: Maybe<Call>;
  errors: Array<OperationError>;
  idempotencyKey?: Maybe<Scalars['String']['output']>;
};

export type CallStatus = 'ACTIVE' | 'ENDED' | 'FAILED' | 'RINGING';

export type ChangeMemberRoleInput = {
  actionId: Scalars['String']['input'];
  expectedVersion: Scalars['Long']['input'];
  membershipId: Scalars['ID']['input'];
  roleId: Scalars['ID']['input'];
  workspaceId: Scalars['ID']['input'];
};

export type Conversation = Node & {
  __typename?: 'Conversation';
  id: Scalars['ID']['output'];
  members: MembershipConnection;
  status: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
  type: ConversationType;
  unreadCount: Scalars['Int']['output'];
  version: Scalars['Long']['output'];
  visibility: ConversationVisibility;
  workspaceId: Scalars['ID']['output'];
};

export type ConversationMembersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type ConversationConnection = {
  __typename?: 'ConversationConnection';
  edges: Array<ConversationEdge>;
  pageInfo: PageInfo;
};

export type ConversationEdge = {
  __typename?: 'ConversationEdge';
  cursor: Scalars['String']['output'];
  node: Conversation;
};

export type ConversationFilter = {
  status?: InputMaybe<ConversationStatus>;
  text?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<ConversationType>;
  visibility?: InputMaybe<ConversationVisibility>;
};

export type ConversationPayload = {
  __typename?: 'ConversationPayload';
  conversation?: Maybe<Conversation>;
  errors: Array<OperationError>;
  idempotencyKey?: Maybe<Scalars['String']['output']>;
};

export type ConversationSort = {
  direction?: InputMaybe<SortDirection>;
  field?: InputMaybe<ConversationSortField>;
};

export type ConversationSortField = 'ID' | 'TITLE' | 'TYPE';

export type ConversationStats = {
  __typename?: 'ConversationStats';
  conversationId: Scalars['ID']['output'];
  deletedCount: Scalars['Int']['output'];
  lastSequence: Scalars['Long']['output'];
  messageCount: Scalars['Int']['output'];
  participantCount: Scalars['Int']['output'];
  replyCount: Scalars['Int']['output'];
  unreadCount: Scalars['Int']['output'];
};

export type ConversationStatus = 'ACTIVE' | 'ARCHIVED';

export type ConversationType = 'CHANNEL' | 'DIRECT' | 'GROUP';

export type ConversationVisibility = 'PRIVATE' | 'PUBLIC';

export type CreateConversationInput = {
  idempotencyKey: Scalars['String']['input'];
  memberIds: Array<Scalars['ID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  type: ConversationType;
  visibility: ConversationVisibility;
  workspaceId: Scalars['ID']['input'];
};

export type CreateWorkspaceInput = {
  idempotencyKey: Scalars['String']['input'];
  name: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};

export type Device = {
  __typename?: 'Device';
  id: Scalars['ID']['output'];
  lastSeenAt?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  platform: Scalars['String']['output'];
  trusted: Scalars['Boolean']['output'];
};

export type EditMessageInput = {
  body: Scalars['String']['input'];
  expectedVersion: Scalars['Long']['input'];
  idempotencyKey: Scalars['String']['input'];
  messageId: Scalars['ID']['input'];
};

export type EventSort = {
  direction?: InputMaybe<SortDirection>;
  field?: InputMaybe<EventSortField>;
};

export type EventSortField = 'CREATED_AT' | 'ID';

export type File = Node & {
  __typename?: 'File';
  downloadUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  mimeType: Scalars['String']['output'];
  name: Scalars['String']['output'];
  sizeBytes: Scalars['Long']['output'];
  status: FileStatus;
};

export type FilePayload = {
  __typename?: 'FilePayload';
  errors: Array<OperationError>;
  file?: Maybe<File>;
  idempotencyKey?: Maybe<Scalars['String']['output']>;
};

export type FileStatus = 'DELETED' | 'PENDING' | 'QUARANTINED' | 'READY';

export type Invitation = {
  __typename?: 'Invitation';
  createdAt: Scalars['DateTime']['output'];
  expiresAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  roleId: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type InvitationPayload = {
  __typename?: 'InvitationPayload';
  errors: Array<OperationError>;
  idempotencyKey?: Maybe<Scalars['String']['output']>;
  invitation?: Maybe<Invitation>;
};

export type InviteMemberInput = {
  expiresAt: Scalars['DateTime']['input'];
  idempotencyKey: Scalars['String']['input'];
  roleId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
  workspaceId: Scalars['ID']['input'];
};

export type MarkReadInput = {
  conversationId: Scalars['ID']['input'];
  sequence: Scalars['Long']['input'];
};

export type MemberSort = {
  direction?: InputMaybe<SortDirection>;
  field?: InputMaybe<MemberSortField>;
};

export type MemberSortField = 'ID' | 'JOINED_AT';

export type MemberStatus = 'ACTIVE' | 'INVITED' | 'REMOVED' | 'SUSPENDED';

export type Membership = Node & {
  __typename?: 'Membership';
  id: Scalars['ID']['output'];
  joinedAt?: Maybe<Scalars['DateTime']['output']>;
  role: Role;
  status: MemberStatus;
  teams: Array<Team>;
  user: User;
  version: Scalars['Long']['output'];
};

export type MembershipConnection = {
  __typename?: 'MembershipConnection';
  edges: Array<MembershipEdge>;
  pageInfo: PageInfo;
};

export type MembershipEdge = {
  __typename?: 'MembershipEdge';
  cursor: Scalars['String']['output'];
  node: Membership;
};

export type MembershipFilter = {
  roleId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<MemberStatus>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type MembershipPayload = {
  __typename?: 'MembershipPayload';
  errors: Array<OperationError>;
  idempotencyKey?: Maybe<Scalars['String']['output']>;
  membership?: Maybe<Membership>;
};

export type Message = Node & {
  __typename?: 'Message';
  attachments: Array<Attachment>;
  body?: Maybe<Scalars['String']['output']>;
  conversationId: Scalars['ID']['output'];
  editedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  reactions: Array<ReactionSummary>;
  sender: User;
  sentAt: Scalars['DateTime']['output'];
  sequence: Scalars['Long']['output'];
  status: MessageStatus;
  threadRootId?: Maybe<Scalars['ID']['output']>;
  version: Scalars['Long']['output'];
};

export type MessageConnection = {
  __typename?: 'MessageConnection';
  edges: Array<MessageEdge>;
  pageInfo: PageInfo;
};

export type MessageEdge = {
  __typename?: 'MessageEdge';
  cursor: Scalars['String']['output'];
  node: Message;
};

export type MessageFilter = {
  from?: InputMaybe<Scalars['DateTime']['input']>;
  senderId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<MessageStatus>;
  text?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

export type MessagePayload = {
  __typename?: 'MessagePayload';
  errors: Array<OperationError>;
  idempotencyKey?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Message>;
};

export type MessageSort = {
  direction?: InputMaybe<SortDirection>;
  field?: InputMaybe<MessageSortField>;
};

export type MessageSortField = 'ID' | 'SENT_AT' | 'SEQUENCE';

export type MessageStatus = 'DELETED' | 'EDITED' | 'SENT';

export type Mutation = {
  __typename?: 'Mutation';
  acceptInvitation: MembershipPayload;
  addConversationMember: ConversationPayload;
  archiveConversation: ConversationPayload;
  assignTeamMember: TeamPayload;
  changeMemberRole: MembershipPayload;
  createConversation: ConversationPayload;
  createTeam: TeamPayload;
  createWorkspace: WorkspacePayload;
  deactivateMember: MembershipPayload;
  deleteFile: FilePayload;
  deleteMessage: MessagePayload;
  editMessage: MessagePayload;
  endCall: CallPayload;
  inviteMember: InvitationPayload;
  joinCall: CallPayload;
  leaveCall: CallPayload;
  markNotificationRead: NotificationPayload;
  markRead: ReadStatePayload;
  revokeSession: SessionPayload;
  sendMessage: MessagePayload;
  setReaction: MessagePayload;
  startCall: CallPayload;
  updateConversation: ConversationPayload;
  updateProfile: UserPayload;
  updateWorkspacePolicy: PolicyPayload;
};

export type MutationAcceptInvitationArgs = {
  idempotencyKey: Scalars['String']['input'];
  invitationId: Scalars['ID']['input'];
};

export type MutationAddConversationMemberArgs = {
  conversationId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type MutationArchiveConversationArgs = {
  actionId: Scalars['String']['input'];
  conversationId: Scalars['ID']['input'];
  expectedVersion: Scalars['Long']['input'];
};

export type MutationAssignTeamMemberArgs = {
  active: Scalars['Boolean']['input'];
  membershipId: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
  workspaceId: Scalars['ID']['input'];
};

export type MutationChangeMemberRoleArgs = {
  input: ChangeMemberRoleInput;
};

export type MutationCreateConversationArgs = {
  input: CreateConversationInput;
};

export type MutationCreateTeamArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  idempotencyKey: Scalars['String']['input'];
  name: Scalars['String']['input'];
  workspaceId: Scalars['ID']['input'];
};

export type MutationCreateWorkspaceArgs = {
  input: CreateWorkspaceInput;
};

export type MutationDeactivateMemberArgs = {
  actionId: Scalars['String']['input'];
  expectedVersion: Scalars['Long']['input'];
  membershipId: Scalars['ID']['input'];
  workspaceId: Scalars['ID']['input'];
};

export type MutationDeleteFileArgs = {
  fileId: Scalars['ID']['input'];
  idempotencyKey: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};

export type MutationDeleteMessageArgs = {
  expectedVersion: Scalars['Long']['input'];
  idempotencyKey: Scalars['String']['input'];
  messageId: Scalars['ID']['input'];
};

export type MutationEditMessageArgs = {
  input: EditMessageInput;
};

export type MutationEndCallArgs = {
  callId: Scalars['ID']['input'];
  idempotencyKey: Scalars['String']['input'];
};

export type MutationInviteMemberArgs = {
  input: InviteMemberInput;
};

export type MutationJoinCallArgs = {
  callId: Scalars['ID']['input'];
  idempotencyKey: Scalars['String']['input'];
};

export type MutationLeaveCallArgs = {
  callId: Scalars['ID']['input'];
  idempotencyKey: Scalars['String']['input'];
};

export type MutationMarkNotificationReadArgs = {
  id: Scalars['ID']['input'];
  read: Scalars['Boolean']['input'];
};

export type MutationMarkReadArgs = {
  input: MarkReadInput;
};

export type MutationRevokeSessionArgs = {
  idempotencyKey: Scalars['String']['input'];
  sessionId: Scalars['ID']['input'];
};

export type MutationSendMessageArgs = {
  input: SendMessageInput;
};

export type MutationSetReactionArgs = {
  input: SetReactionInput;
};

export type MutationStartCallArgs = {
  input: StartCallInput;
};

export type MutationUpdateConversationArgs = {
  input: UpdateConversationInput;
};

export type MutationUpdateProfileArgs = {
  input: UpdateProfileInput;
};

export type MutationUpdateWorkspacePolicyArgs = {
  input: UpdateWorkspacePolicyInput;
};

export type Node = {
  id: Scalars['ID']['output'];
};

export type Notification = Node & {
  __typename?: 'Notification';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  preview: Scalars['JSON']['output'];
  readAt?: Maybe<Scalars['DateTime']['output']>;
  targetId: Scalars['ID']['output'];
  targetType: Scalars['String']['output'];
  type: Scalars['String']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type NotificationConnection = {
  __typename?: 'NotificationConnection';
  edges: Array<NotificationEdge>;
  pageInfo: PageInfo;
};

export type NotificationEdge = {
  __typename?: 'NotificationEdge';
  cursor: Scalars['String']['output'];
  node: Notification;
};

export type NotificationFilter = {
  from?: InputMaybe<Scalars['DateTime']['input']>;
  to?: InputMaybe<Scalars['DateTime']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type NotificationPayload = {
  __typename?: 'NotificationPayload';
  errors: Array<OperationError>;
  idempotencyKey?: Maybe<Scalars['String']['output']>;
  notification?: Maybe<Notification>;
};

export type OperationError = {
  __typename?: 'OperationError';
  code: Scalars['String']['output'];
  field?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  retryable: Scalars['Boolean']['output'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
};

export type Permission = {
  __typename?: 'Permission';
  code: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  scope: Scalars['String']['output'];
};

export type PolicyPayload = {
  __typename?: 'PolicyPayload';
  errors: Array<OperationError>;
  idempotencyKey?: Maybe<Scalars['String']['output']>;
  policy?: Maybe<WorkspacePolicy>;
};

export type Presence = {
  __typename?: 'Presence';
  lastHeartbeat: Scalars['DateTime']['output'];
  status: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type Query = {
  __typename?: 'Query';
  activeCall?: Maybe<Call>;
  adminDashboard: AdminDashboard;
  auditEvents: AuditEventConnection;
  call?: Maybe<Call>;
  conversation?: Maybe<Conversation>;
  conversationStats: ConversationStats;
  conversations: ConversationConnection;
  file?: Maybe<File>;
  me: User;
  members: MembershipConnection;
  messages: MessageConnection;
  notifications: NotificationConnection;
  presence: Array<Presence>;
  roles: Array<Role>;
  search: SearchConnection;
  sessions: SessionConnection;
  teams: Array<Team>;
  thread: MessageConnection;
  workspace?: Maybe<Workspace>;
  workspaces: Array<Workspace>;
};

export type QueryActiveCallArgs = {
  conversationId: Scalars['ID']['input'];
};

export type QueryAdminDashboardArgs = {
  workspaceId: Scalars['ID']['input'];
};

export type QueryAuditEventsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter: AuditFilterInput;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<EventSort>;
};

export type QueryCallArgs = {
  id: Scalars['ID']['input'];
};

export type QueryConversationArgs = {
  id: Scalars['ID']['input'];
};

export type QueryConversationStatsArgs = {
  conversationId: Scalars['ID']['input'];
};

export type QueryConversationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ConversationFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<ConversationSort>;
  workspaceId: Scalars['ID']['input'];
};

export type QueryFileArgs = {
  id: Scalars['ID']['input'];
};

export type QueryMembersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<MembershipFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<MemberSort>;
  workspaceId: Scalars['ID']['input'];
};

export type QueryMessagesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  conversationId: Scalars['ID']['input'];
  filter?: InputMaybe<MessageFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<MessageSort>;
};

export type QueryNotificationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NotificationFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<EventSort>;
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryPresenceArgs = {
  userIds: Array<Scalars['ID']['input']>;
  workspaceId: Scalars['ID']['input'];
};

export type QueryRolesArgs = {
  workspaceId: Scalars['ID']['input'];
};

export type QuerySearchArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  input: SearchInput;
  sort?: InputMaybe<SearchSort>;
};

export type QuerySessionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryTeamsArgs = {
  workspaceId: Scalars['ID']['input'];
};

export type QueryThreadArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<MessageFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  rootMessageId: Scalars['ID']['input'];
  sort?: InputMaybe<MessageSort>;
};

export type QueryWorkspaceArgs = {
  id: Scalars['ID']['input'];
};

export type ReactionSummary = {
  __typename?: 'ReactionSummary';
  count: Scalars['Int']['output'];
  emoji: Scalars['String']['output'];
  reactedByMe: Scalars['Boolean']['output'];
};

export type ReadState = {
  __typename?: 'ReadState';
  conversationId: Scalars['ID']['output'];
  sequence: Scalars['Long']['output'];
};

export type ReadStatePayload = {
  __typename?: 'ReadStatePayload';
  errors: Array<OperationError>;
  idempotencyKey?: Maybe<Scalars['String']['output']>;
  readState?: Maybe<ReadState>;
};

export type Recording = {
  __typename?: 'Recording';
  callId: Scalars['ID']['output'];
  fileId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  status: Scalars['String']['output'];
};

export type Role = Node & {
  __typename?: 'Role';
  code: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Permission>;
  systemRole: Scalars['Boolean']['output'];
  version: Scalars['Long']['output'];
};

export type SearchConnection = {
  __typename?: 'SearchConnection';
  edges: Array<SearchEdge>;
  pageInfo: PageInfo;
};

export type SearchEdge = {
  __typename?: 'SearchEdge';
  cursor: Scalars['String']['output'];
  node: SearchResult;
};

export type SearchInput = {
  conversationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  from?: InputMaybe<Scalars['DateTime']['input']>;
  text: Scalars['String']['input'];
  to?: InputMaybe<Scalars['DateTime']['input']>;
  types?: Array<Scalars['String']['input']>;
  workspaceId: Scalars['ID']['input'];
};

export type SearchResult = {
  __typename?: 'SearchResult';
  snippet?: Maybe<Scalars['String']['output']>;
  sourceId: Scalars['ID']['output'];
  sourceType: Scalars['String']['output'];
  sourceVersion: Scalars['Long']['output'];
  title: Scalars['String']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type SearchSort = {
  direction?: InputMaybe<SortDirection>;
  field?: InputMaybe<SearchSortField>;
};

export type SearchSortField = 'ID' | 'TITLE';

export type SendMessageInput = {
  body: Scalars['String']['input'];
  clientMessageId: Scalars['ID']['input'];
  conversationId: Scalars['ID']['input'];
  fileIds?: Array<Scalars['ID']['input']>;
  threadRootId?: InputMaybe<Scalars['ID']['input']>;
};

export type Session = Node & {
  __typename?: 'Session';
  createdAt: Scalars['DateTime']['output'];
  device?: Maybe<Device>;
  expiresAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  lastSeenAt: Scalars['DateTime']['output'];
  status: Scalars['String']['output'];
};

export type SessionConnection = {
  __typename?: 'SessionConnection';
  edges: Array<SessionEdge>;
  pageInfo: PageInfo;
};

export type SessionEdge = {
  __typename?: 'SessionEdge';
  cursor: Scalars['String']['output'];
  node: Session;
};

export type SessionPayload = {
  __typename?: 'SessionPayload';
  errors: Array<OperationError>;
  idempotencyKey?: Maybe<Scalars['String']['output']>;
  session?: Maybe<Session>;
};

export type SetReactionInput = {
  active: Scalars['Boolean']['input'];
  emoji: Scalars['String']['input'];
  messageId: Scalars['ID']['input'];
};

export type SortDirection = 'ASC' | 'DESC';

export type StartCallInput = {
  conversationId: Scalars['ID']['input'];
  idempotencyKey: Scalars['String']['input'];
  inviteeIds?: Array<Scalars['ID']['input']>;
  mode: CallMode;
};

export type Team = {
  __typename?: 'Team';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  status: Scalars['String']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type TeamPayload = {
  __typename?: 'TeamPayload';
  errors: Array<OperationError>;
  idempotencyKey?: Maybe<Scalars['String']['output']>;
  team?: Maybe<Team>;
};

export type UpdateConversationInput = {
  conversationId: Scalars['ID']['input'];
  expectedVersion: Scalars['Long']['input'];
  idempotencyKey: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type UpdateProfileInput = {
  avatarFileId?: InputMaybe<Scalars['ID']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  expectedVersion: Scalars['Long']['input'];
  idempotencyKey: Scalars['String']['input'];
};

export type UpdateWorkspacePolicyInput = {
  actionId: Scalars['String']['input'];
  channelRules?: InputMaybe<Scalars['JSON']['input']>;
  expectedVersion: Scalars['Long']['input'];
  fileRules?: InputMaybe<Scalars['JSON']['input']>;
  guestPolicy?: InputMaybe<Scalars['JSON']['input']>;
  mfaRequired?: InputMaybe<Scalars['Boolean']['input']>;
  retentionDays?: InputMaybe<Scalars['Int']['input']>;
  workspaceId: Scalars['ID']['input'];
};

export type User = Node & {
  __typename?: 'User';
  avatarFileId?: Maybe<Scalars['ID']['output']>;
  displayName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  login: Scalars['String']['output'];
  status: UserStatus;
  version: Scalars['Long']['output'];
};

export type UserPayload = {
  __typename?: 'UserPayload';
  errors: Array<OperationError>;
  idempotencyKey?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
};

export type UserStatus = 'ACTIVE' | 'DELETED' | 'DISABLED' | 'PENDING';

export type Workspace = Node & {
  __typename?: 'Workspace';
  id: Scalars['ID']['output'];
  myMembership: Membership;
  name: Scalars['String']['output'];
  policy: WorkspacePolicy;
  slug: Scalars['String']['output'];
  status: Scalars['String']['output'];
  version: Scalars['Long']['output'];
};

export type WorkspacePayload = {
  __typename?: 'WorkspacePayload';
  errors: Array<OperationError>;
  idempotencyKey?: Maybe<Scalars['String']['output']>;
  workspace?: Maybe<Workspace>;
};

export type WorkspacePolicy = {
  __typename?: 'WorkspacePolicy';
  channelRules: Scalars['JSON']['output'];
  fileRules: Scalars['JSON']['output'];
  guestPolicy: Scalars['JSON']['output'];
  mfaRequired: Scalars['Boolean']['output'];
  retentionDays: Scalars['Int']['output'];
  version: Scalars['Long']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<
  TResult,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<
  TTypes,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<
  T = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = Record<PropertyKey, never>,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping of interface types */
export type ResolversInterfaceTypes<_RefType extends Record<string, unknown>> = {
  Node:
    | AuditEvent
    | CallModel
    | ConversationModel
    | FileRecordModel
    | MembershipModel
    | MessageModel
    | Notification
    | RoleModel
    | SessionModel
    | UserModel
    | WorkspaceModel;
};

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AdminDashboard: ResolverTypeWrapper<AdminDashboard>;
  Attachment: ResolverTypeWrapper<AttachmentModel>;
  AuditEvent: ResolverTypeWrapper<AuditEvent>;
  AuditEventConnection: ResolverTypeWrapper<AuditEventConnection>;
  AuditEventEdge: ResolverTypeWrapper<AuditEventEdge>;
  AuditFilterInput: AuditFilterInput;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Call: ResolverTypeWrapper<CallModel>;
  CallMode: CallMode;
  CallParticipant: ResolverTypeWrapper<CallParticipantModel>;
  CallPayload: ResolverTypeWrapper<
    Omit<CallPayload, 'call'> & { call?: Maybe<ResolversTypes['Call']> }
  >;
  CallStatus: CallStatus;
  ChangeMemberRoleInput: ChangeMemberRoleInput;
  Conversation: ResolverTypeWrapper<ConversationModel>;
  ConversationConnection: ResolverTypeWrapper<
    Omit<ConversationConnection, 'edges'> & {
      edges: Array<ResolversTypes['ConversationEdge']>;
    }
  >;
  ConversationEdge: ResolverTypeWrapper<
    Omit<ConversationEdge, 'node'> & { node: ResolversTypes['Conversation'] }
  >;
  ConversationFilter: ConversationFilter;
  ConversationPayload: ResolverTypeWrapper<
    Omit<ConversationPayload, 'conversation'> & {
      conversation?: Maybe<ResolversTypes['Conversation']>;
    }
  >;
  ConversationSort: ConversationSort;
  ConversationSortField: ConversationSortField;
  ConversationStats: ResolverTypeWrapper<ConversationStats>;
  ConversationStatus: ConversationStatus;
  ConversationType: ConversationType;
  ConversationVisibility: ConversationVisibility;
  CreateConversationInput: CreateConversationInput;
  CreateWorkspaceInput: CreateWorkspaceInput;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Device: ResolverTypeWrapper<DeviceModel>;
  EditMessageInput: EditMessageInput;
  EventSort: EventSort;
  EventSortField: EventSortField;
  File: ResolverTypeWrapper<FileRecordModel>;
  FilePayload: ResolverTypeWrapper<
    Omit<FilePayload, 'file'> & { file?: Maybe<ResolversTypes['File']> }
  >;
  FileStatus: FileStatus;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Invitation: ResolverTypeWrapper<Invitation>;
  InvitationPayload: ResolverTypeWrapper<InvitationPayload>;
  InviteMemberInput: InviteMemberInput;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  Long: ResolverTypeWrapper<Scalars['Long']['output']>;
  MarkReadInput: MarkReadInput;
  MemberSort: MemberSort;
  MemberSortField: MemberSortField;
  MemberStatus: MemberStatus;
  Membership: ResolverTypeWrapper<MembershipModel>;
  MembershipConnection: ResolverTypeWrapper<
    Omit<MembershipConnection, 'edges'> & {
      edges: Array<ResolversTypes['MembershipEdge']>;
    }
  >;
  MembershipEdge: ResolverTypeWrapper<
    Omit<MembershipEdge, 'node'> & { node: ResolversTypes['Membership'] }
  >;
  MembershipFilter: MembershipFilter;
  MembershipPayload: ResolverTypeWrapper<
    Omit<MembershipPayload, 'membership'> & {
      membership?: Maybe<ResolversTypes['Membership']>;
    }
  >;
  Message: ResolverTypeWrapper<MessageModel>;
  MessageConnection: ResolverTypeWrapper<
    Omit<MessageConnection, 'edges'> & { edges: Array<ResolversTypes['MessageEdge']> }
  >;
  MessageEdge: ResolverTypeWrapper<
    Omit<MessageEdge, 'node'> & { node: ResolversTypes['Message'] }
  >;
  MessageFilter: MessageFilter;
  MessagePayload: ResolverTypeWrapper<
    Omit<MessagePayload, 'message'> & { message?: Maybe<ResolversTypes['Message']> }
  >;
  MessageSort: MessageSort;
  MessageSortField: MessageSortField;
  MessageStatus: MessageStatus;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Node: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['Node']>;
  Notification: ResolverTypeWrapper<Notification>;
  NotificationConnection: ResolverTypeWrapper<NotificationConnection>;
  NotificationEdge: ResolverTypeWrapper<NotificationEdge>;
  NotificationFilter: NotificationFilter;
  NotificationPayload: ResolverTypeWrapper<NotificationPayload>;
  OperationError: ResolverTypeWrapper<OperationError>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  Permission: ResolverTypeWrapper<PermissionModel>;
  PolicyPayload: ResolverTypeWrapper<
    Omit<PolicyPayload, 'policy'> & { policy?: Maybe<ResolversTypes['WorkspacePolicy']> }
  >;
  Presence: ResolverTypeWrapper<Presence>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  ReactionSummary: ResolverTypeWrapper<ReactionSummary>;
  ReadState: ResolverTypeWrapper<ReadState>;
  ReadStatePayload: ResolverTypeWrapper<ReadStatePayload>;
  Recording: ResolverTypeWrapper<RecordingModel>;
  Role: ResolverTypeWrapper<RoleModel>;
  SearchConnection: ResolverTypeWrapper<SearchConnection>;
  SearchEdge: ResolverTypeWrapper<SearchEdge>;
  SearchInput: SearchInput;
  SearchResult: ResolverTypeWrapper<SearchResult>;
  SearchSort: SearchSort;
  SearchSortField: SearchSortField;
  SendMessageInput: SendMessageInput;
  Session: ResolverTypeWrapper<SessionModel>;
  SessionConnection: ResolverTypeWrapper<
    Omit<SessionConnection, 'edges'> & { edges: Array<ResolversTypes['SessionEdge']> }
  >;
  SessionEdge: ResolverTypeWrapper<
    Omit<SessionEdge, 'node'> & { node: ResolversTypes['Session'] }
  >;
  SessionPayload: ResolverTypeWrapper<
    Omit<SessionPayload, 'session'> & { session?: Maybe<ResolversTypes['Session']> }
  >;
  SetReactionInput: SetReactionInput;
  SortDirection: SortDirection;
  StartCallInput: StartCallInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Team: ResolverTypeWrapper<TeamModel>;
  TeamPayload: ResolverTypeWrapper<
    Omit<TeamPayload, 'team'> & { team?: Maybe<ResolversTypes['Team']> }
  >;
  UpdateConversationInput: UpdateConversationInput;
  UpdateProfileInput: UpdateProfileInput;
  UpdateWorkspacePolicyInput: UpdateWorkspacePolicyInput;
  User: ResolverTypeWrapper<UserModel>;
  UserPayload: ResolverTypeWrapper<
    Omit<UserPayload, 'user'> & { user?: Maybe<ResolversTypes['User']> }
  >;
  UserStatus: UserStatus;
  Workspace: ResolverTypeWrapper<WorkspaceModel>;
  WorkspacePayload: ResolverTypeWrapper<
    Omit<WorkspacePayload, 'workspace'> & {
      workspace?: Maybe<ResolversTypes['Workspace']>;
    }
  >;
  WorkspacePolicy: ResolverTypeWrapper<PolicyModel>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AdminDashboard: AdminDashboard;
  Attachment: AttachmentModel;
  AuditEvent: AuditEvent;
  AuditEventConnection: AuditEventConnection;
  AuditEventEdge: AuditEventEdge;
  AuditFilterInput: AuditFilterInput;
  Boolean: Scalars['Boolean']['output'];
  Call: CallModel;
  CallParticipant: CallParticipantModel;
  CallPayload: Omit<CallPayload, 'call'> & { call?: Maybe<ResolversParentTypes['Call']> };
  ChangeMemberRoleInput: ChangeMemberRoleInput;
  Conversation: ConversationModel;
  ConversationConnection: Omit<ConversationConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['ConversationEdge']>;
  };
  ConversationEdge: Omit<ConversationEdge, 'node'> & {
    node: ResolversParentTypes['Conversation'];
  };
  ConversationFilter: ConversationFilter;
  ConversationPayload: Omit<ConversationPayload, 'conversation'> & {
    conversation?: Maybe<ResolversParentTypes['Conversation']>;
  };
  ConversationSort: ConversationSort;
  ConversationStats: ConversationStats;
  CreateConversationInput: CreateConversationInput;
  CreateWorkspaceInput: CreateWorkspaceInput;
  DateTime: Scalars['DateTime']['output'];
  Device: DeviceModel;
  EditMessageInput: EditMessageInput;
  EventSort: EventSort;
  File: FileRecordModel;
  FilePayload: Omit<FilePayload, 'file'> & { file?: Maybe<ResolversParentTypes['File']> };
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Invitation: Invitation;
  InvitationPayload: InvitationPayload;
  InviteMemberInput: InviteMemberInput;
  JSON: Scalars['JSON']['output'];
  Long: Scalars['Long']['output'];
  MarkReadInput: MarkReadInput;
  MemberSort: MemberSort;
  Membership: MembershipModel;
  MembershipConnection: Omit<MembershipConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['MembershipEdge']>;
  };
  MembershipEdge: Omit<MembershipEdge, 'node'> & {
    node: ResolversParentTypes['Membership'];
  };
  MembershipFilter: MembershipFilter;
  MembershipPayload: Omit<MembershipPayload, 'membership'> & {
    membership?: Maybe<ResolversParentTypes['Membership']>;
  };
  Message: MessageModel;
  MessageConnection: Omit<MessageConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['MessageEdge']>;
  };
  MessageEdge: Omit<MessageEdge, 'node'> & { node: ResolversParentTypes['Message'] };
  MessageFilter: MessageFilter;
  MessagePayload: Omit<MessagePayload, 'message'> & {
    message?: Maybe<ResolversParentTypes['Message']>;
  };
  MessageSort: MessageSort;
  Mutation: Record<PropertyKey, never>;
  Node: ResolversInterfaceTypes<ResolversParentTypes>['Node'];
  Notification: Notification;
  NotificationConnection: NotificationConnection;
  NotificationEdge: NotificationEdge;
  NotificationFilter: NotificationFilter;
  NotificationPayload: NotificationPayload;
  OperationError: OperationError;
  PageInfo: PageInfo;
  Permission: PermissionModel;
  PolicyPayload: Omit<PolicyPayload, 'policy'> & {
    policy?: Maybe<ResolversParentTypes['WorkspacePolicy']>;
  };
  Presence: Presence;
  Query: Record<PropertyKey, never>;
  ReactionSummary: ReactionSummary;
  ReadState: ReadState;
  ReadStatePayload: ReadStatePayload;
  Recording: RecordingModel;
  Role: RoleModel;
  SearchConnection: SearchConnection;
  SearchEdge: SearchEdge;
  SearchInput: SearchInput;
  SearchResult: SearchResult;
  SearchSort: SearchSort;
  SendMessageInput: SendMessageInput;
  Session: SessionModel;
  SessionConnection: Omit<SessionConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['SessionEdge']>;
  };
  SessionEdge: Omit<SessionEdge, 'node'> & { node: ResolversParentTypes['Session'] };
  SessionPayload: Omit<SessionPayload, 'session'> & {
    session?: Maybe<ResolversParentTypes['Session']>;
  };
  SetReactionInput: SetReactionInput;
  StartCallInput: StartCallInput;
  String: Scalars['String']['output'];
  Team: TeamModel;
  TeamPayload: Omit<TeamPayload, 'team'> & { team?: Maybe<ResolversParentTypes['Team']> };
  UpdateConversationInput: UpdateConversationInput;
  UpdateProfileInput: UpdateProfileInput;
  UpdateWorkspacePolicyInput: UpdateWorkspacePolicyInput;
  User: UserModel;
  UserPayload: Omit<UserPayload, 'user'> & { user?: Maybe<ResolversParentTypes['User']> };
  Workspace: WorkspaceModel;
  WorkspacePayload: Omit<WorkspacePayload, 'workspace'> & {
    workspace?: Maybe<ResolversParentTypes['Workspace']>;
  };
  WorkspacePolicy: PolicyModel;
};

export type AdminDashboardResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['AdminDashboard'] =
    ResolversParentTypes['AdminDashboard'],
> = {
  activeMembers?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  callsLast30Days?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  channelCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  degradedServices?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  messagesLast30Days?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  pendingInvites?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  storageLimit?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  storageUsed?: Resolver<Maybe<ResolversTypes['Long']>, ParentType, ContextType>;
  totalMembers?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  workspaceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type AttachmentResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Attachment'] =
    ResolversParentTypes['Attachment'],
> = {
  file?: Resolver<ResolversTypes['File'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  messageId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type AuditEventResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['AuditEvent'] =
    ResolversParentTypes['AuditEvent'],
> = {
  action?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  actorId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  metadata?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  occurredAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  outcome?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  targetId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  targetType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AuditEventConnectionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['AuditEventConnection'] =
    ResolversParentTypes['AuditEventConnection'],
> = {
  edges?: Resolver<Array<ResolversTypes['AuditEventEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
};

export type AuditEventEdgeResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['AuditEventEdge'] =
    ResolversParentTypes['AuditEventEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['AuditEvent'], ParentType, ContextType>;
};

export type CallResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Call'] = ResolversParentTypes['Call'],
> = {
  conversationId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  endedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  mode?: Resolver<ResolversTypes['CallMode'], ParentType, ContextType>;
  participants?: Resolver<
    Array<ResolversTypes['CallParticipant']>,
    ParentType,
    ContextType
  >;
  recordings?: Resolver<Array<ResolversTypes['Recording']>, ParentType, ContextType>;
  startedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['CallStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CallParticipantResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['CallParticipant'] =
    ResolversParentTypes['CallParticipant'],
> = {
  joinedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  leftAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
};

export type CallPayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['CallPayload'] =
    ResolversParentTypes['CallPayload'],
> = {
  call?: Resolver<Maybe<ResolversTypes['Call']>, ParentType, ContextType>;
  errors?: Resolver<Array<ResolversTypes['OperationError']>, ParentType, ContextType>;
  idempotencyKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type ConversationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Conversation'] =
    ResolversParentTypes['Conversation'],
> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  members?: Resolver<
    ResolversTypes['MembershipConnection'],
    ParentType,
    ContextType,
    RequireFields<ConversationMembersArgs, 'first'>
  >;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ConversationType'], ParentType, ContextType>;
  unreadCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  visibility?: Resolver<
    ResolversTypes['ConversationVisibility'],
    ParentType,
    ContextType
  >;
  workspaceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConversationConnectionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['ConversationConnection'] =
    ResolversParentTypes['ConversationConnection'],
> = {
  edges?: Resolver<Array<ResolversTypes['ConversationEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
};

export type ConversationEdgeResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['ConversationEdge'] =
    ResolversParentTypes['ConversationEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Conversation'], ParentType, ContextType>;
};

export type ConversationPayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['ConversationPayload'] =
    ResolversParentTypes['ConversationPayload'],
> = {
  conversation?: Resolver<Maybe<ResolversTypes['Conversation']>, ParentType, ContextType>;
  errors?: Resolver<Array<ResolversTypes['OperationError']>, ParentType, ContextType>;
  idempotencyKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type ConversationStatsResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['ConversationStats'] =
    ResolversParentTypes['ConversationStats'],
> = {
  conversationId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  deletedCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lastSequence?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  messageCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  participantCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  replyCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unreadCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<
  ResolversTypes['DateTime'],
  any
> {
  name: 'DateTime';
}

export type DeviceResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Device'] = ResolversParentTypes['Device'],
> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastSeenAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  platform?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  trusted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type FileResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['File'] = ResolversParentTypes['File'],
> = {
  downloadUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  mimeType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sizeBytes?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['FileStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FilePayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['FilePayload'] =
    ResolversParentTypes['FilePayload'],
> = {
  errors?: Resolver<Array<ResolversTypes['OperationError']>, ParentType, ContextType>;
  file?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  idempotencyKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type InvitationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Invitation'] =
    ResolversParentTypes['Invitation'],
> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  expiresAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  roleId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  workspaceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type InvitationPayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['InvitationPayload'] =
    ResolversParentTypes['InvitationPayload'],
> = {
  errors?: Resolver<Array<ResolversTypes['OperationError']>, ParentType, ContextType>;
  idempotencyKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  invitation?: Resolver<Maybe<ResolversTypes['Invitation']>, ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<
  ResolversTypes['JSON'],
  any
> {
  name: 'JSON';
}

export interface LongScalarConfig extends GraphQLScalarTypeConfig<
  ResolversTypes['Long'],
  any
> {
  name: 'Long';
}

export type MembershipResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Membership'] =
    ResolversParentTypes['Membership'],
> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  joinedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  role?: Resolver<ResolversTypes['Role'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['MemberStatus'], ParentType, ContextType>;
  teams?: Resolver<Array<ResolversTypes['Team']>, ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MembershipConnectionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['MembershipConnection'] =
    ResolversParentTypes['MembershipConnection'],
> = {
  edges?: Resolver<Array<ResolversTypes['MembershipEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
};

export type MembershipEdgeResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['MembershipEdge'] =
    ResolversParentTypes['MembershipEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Membership'], ParentType, ContextType>;
};

export type MembershipPayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['MembershipPayload'] =
    ResolversParentTypes['MembershipPayload'],
> = {
  errors?: Resolver<Array<ResolversTypes['OperationError']>, ParentType, ContextType>;
  idempotencyKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  membership?: Resolver<Maybe<ResolversTypes['Membership']>, ParentType, ContextType>;
};

export type MessageResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Message'] = ResolversParentTypes['Message'],
> = {
  attachments?: Resolver<Array<ResolversTypes['Attachment']>, ParentType, ContextType>;
  body?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  conversationId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  editedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  reactions?: Resolver<Array<ResolversTypes['ReactionSummary']>, ParentType, ContextType>;
  sender?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  sentAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  sequence?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['MessageStatus'], ParentType, ContextType>;
  threadRootId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MessageConnectionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['MessageConnection'] =
    ResolversParentTypes['MessageConnection'],
> = {
  edges?: Resolver<Array<ResolversTypes['MessageEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
};

export type MessageEdgeResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['MessageEdge'] =
    ResolversParentTypes['MessageEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Message'], ParentType, ContextType>;
};

export type MessagePayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['MessagePayload'] =
    ResolversParentTypes['MessagePayload'],
> = {
  errors?: Resolver<Array<ResolversTypes['OperationError']>, ParentType, ContextType>;
  idempotencyKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['Message']>, ParentType, ContextType>;
};

export type MutationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation'],
> = {
  acceptInvitation?: Resolver<
    ResolversTypes['MembershipPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationAcceptInvitationArgs, 'idempotencyKey' | 'invitationId'>
  >;
  addConversationMember?: Resolver<
    ResolversTypes['ConversationPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationAddConversationMemberArgs, 'conversationId' | 'userId'>
  >;
  archiveConversation?: Resolver<
    ResolversTypes['ConversationPayload'],
    ParentType,
    ContextType,
    RequireFields<
      MutationArchiveConversationArgs,
      'actionId' | 'conversationId' | 'expectedVersion'
    >
  >;
  assignTeamMember?: Resolver<
    ResolversTypes['TeamPayload'],
    ParentType,
    ContextType,
    RequireFields<
      MutationAssignTeamMemberArgs,
      'active' | 'membershipId' | 'teamId' | 'workspaceId'
    >
  >;
  changeMemberRole?: Resolver<
    ResolversTypes['MembershipPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationChangeMemberRoleArgs, 'input'>
  >;
  createConversation?: Resolver<
    ResolversTypes['ConversationPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationCreateConversationArgs, 'input'>
  >;
  createTeam?: Resolver<
    ResolversTypes['TeamPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationCreateTeamArgs, 'idempotencyKey' | 'name' | 'workspaceId'>
  >;
  createWorkspace?: Resolver<
    ResolversTypes['WorkspacePayload'],
    ParentType,
    ContextType,
    RequireFields<MutationCreateWorkspaceArgs, 'input'>
  >;
  deactivateMember?: Resolver<
    ResolversTypes['MembershipPayload'],
    ParentType,
    ContextType,
    RequireFields<
      MutationDeactivateMemberArgs,
      'actionId' | 'expectedVersion' | 'membershipId' | 'workspaceId'
    >
  >;
  deleteFile?: Resolver<
    ResolversTypes['FilePayload'],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteFileArgs, 'fileId' | 'idempotencyKey' | 'reason'>
  >;
  deleteMessage?: Resolver<
    ResolversTypes['MessagePayload'],
    ParentType,
    ContextType,
    RequireFields<
      MutationDeleteMessageArgs,
      'expectedVersion' | 'idempotencyKey' | 'messageId'
    >
  >;
  editMessage?: Resolver<
    ResolversTypes['MessagePayload'],
    ParentType,
    ContextType,
    RequireFields<MutationEditMessageArgs, 'input'>
  >;
  endCall?: Resolver<
    ResolversTypes['CallPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationEndCallArgs, 'callId' | 'idempotencyKey'>
  >;
  inviteMember?: Resolver<
    ResolversTypes['InvitationPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationInviteMemberArgs, 'input'>
  >;
  joinCall?: Resolver<
    ResolversTypes['CallPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationJoinCallArgs, 'callId' | 'idempotencyKey'>
  >;
  leaveCall?: Resolver<
    ResolversTypes['CallPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationLeaveCallArgs, 'callId' | 'idempotencyKey'>
  >;
  markNotificationRead?: Resolver<
    ResolversTypes['NotificationPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationMarkNotificationReadArgs, 'id' | 'read'>
  >;
  markRead?: Resolver<
    ResolversTypes['ReadStatePayload'],
    ParentType,
    ContextType,
    RequireFields<MutationMarkReadArgs, 'input'>
  >;
  revokeSession?: Resolver<
    ResolversTypes['SessionPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationRevokeSessionArgs, 'idempotencyKey' | 'sessionId'>
  >;
  sendMessage?: Resolver<
    ResolversTypes['MessagePayload'],
    ParentType,
    ContextType,
    RequireFields<MutationSendMessageArgs, 'input'>
  >;
  setReaction?: Resolver<
    ResolversTypes['MessagePayload'],
    ParentType,
    ContextType,
    RequireFields<MutationSetReactionArgs, 'input'>
  >;
  startCall?: Resolver<
    ResolversTypes['CallPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationStartCallArgs, 'input'>
  >;
  updateConversation?: Resolver<
    ResolversTypes['ConversationPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateConversationArgs, 'input'>
  >;
  updateProfile?: Resolver<
    ResolversTypes['UserPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateProfileArgs, 'input'>
  >;
  updateWorkspacePolicy?: Resolver<
    ResolversTypes['PolicyPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateWorkspacePolicyArgs, 'input'>
  >;
};

export type NodeResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Node'] = ResolversParentTypes['Node'],
> = {
  __resolveType: TypeResolveFn<
    | 'AuditEvent'
    | 'Call'
    | 'Conversation'
    | 'File'
    | 'Membership'
    | 'Message'
    | 'Notification'
    | 'Role'
    | 'Session'
    | 'User'
    | 'Workspace',
    ParentType,
    ContextType
  >;
};

export type NotificationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Notification'] =
    ResolversParentTypes['Notification'],
> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  preview?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  readAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  targetId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  targetType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  workspaceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NotificationConnectionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['NotificationConnection'] =
    ResolversParentTypes['NotificationConnection'],
> = {
  edges?: Resolver<Array<ResolversTypes['NotificationEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
};

export type NotificationEdgeResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['NotificationEdge'] =
    ResolversParentTypes['NotificationEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Notification'], ParentType, ContextType>;
};

export type NotificationPayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['NotificationPayload'] =
    ResolversParentTypes['NotificationPayload'],
> = {
  errors?: Resolver<Array<ResolversTypes['OperationError']>, ParentType, ContextType>;
  idempotencyKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  notification?: Resolver<Maybe<ResolversTypes['Notification']>, ParentType, ContextType>;
};

export type OperationErrorResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['OperationError'] =
    ResolversParentTypes['OperationError'],
> = {
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  field?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  retryable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type PageInfoResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo'],
> = {
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type PermissionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Permission'] =
    ResolversParentTypes['Permission'],
> = {
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  scope?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type PolicyPayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['PolicyPayload'] =
    ResolversParentTypes['PolicyPayload'],
> = {
  errors?: Resolver<Array<ResolversTypes['OperationError']>, ParentType, ContextType>;
  idempotencyKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  policy?: Resolver<Maybe<ResolversTypes['WorkspacePolicy']>, ParentType, ContextType>;
};

export type PresenceResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Presence'] = ResolversParentTypes['Presence'],
> = {
  lastHeartbeat?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type QueryResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query'],
> = {
  activeCall?: Resolver<
    Maybe<ResolversTypes['Call']>,
    ParentType,
    ContextType,
    RequireFields<QueryActiveCallArgs, 'conversationId'>
  >;
  adminDashboard?: Resolver<
    ResolversTypes['AdminDashboard'],
    ParentType,
    ContextType,
    RequireFields<QueryAdminDashboardArgs, 'workspaceId'>
  >;
  auditEvents?: Resolver<
    ResolversTypes['AuditEventConnection'],
    ParentType,
    ContextType,
    RequireFields<QueryAuditEventsArgs, 'filter' | 'first'>
  >;
  call?: Resolver<
    Maybe<ResolversTypes['Call']>,
    ParentType,
    ContextType,
    RequireFields<QueryCallArgs, 'id'>
  >;
  conversation?: Resolver<
    Maybe<ResolversTypes['Conversation']>,
    ParentType,
    ContextType,
    RequireFields<QueryConversationArgs, 'id'>
  >;
  conversationStats?: Resolver<
    ResolversTypes['ConversationStats'],
    ParentType,
    ContextType,
    RequireFields<QueryConversationStatsArgs, 'conversationId'>
  >;
  conversations?: Resolver<
    ResolversTypes['ConversationConnection'],
    ParentType,
    ContextType,
    RequireFields<QueryConversationsArgs, 'first' | 'workspaceId'>
  >;
  file?: Resolver<
    Maybe<ResolversTypes['File']>,
    ParentType,
    ContextType,
    RequireFields<QueryFileArgs, 'id'>
  >;
  me?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  members?: Resolver<
    ResolversTypes['MembershipConnection'],
    ParentType,
    ContextType,
    RequireFields<QueryMembersArgs, 'first' | 'workspaceId'>
  >;
  messages?: Resolver<
    ResolversTypes['MessageConnection'],
    ParentType,
    ContextType,
    RequireFields<QueryMessagesArgs, 'conversationId' | 'first'>
  >;
  notifications?: Resolver<
    ResolversTypes['NotificationConnection'],
    ParentType,
    ContextType,
    RequireFields<QueryNotificationsArgs, 'first' | 'unreadOnly'>
  >;
  presence?: Resolver<
    Array<ResolversTypes['Presence']>,
    ParentType,
    ContextType,
    RequireFields<QueryPresenceArgs, 'userIds' | 'workspaceId'>
  >;
  roles?: Resolver<
    Array<ResolversTypes['Role']>,
    ParentType,
    ContextType,
    RequireFields<QueryRolesArgs, 'workspaceId'>
  >;
  search?: Resolver<
    ResolversTypes['SearchConnection'],
    ParentType,
    ContextType,
    RequireFields<QuerySearchArgs, 'first' | 'input'>
  >;
  sessions?: Resolver<
    ResolversTypes['SessionConnection'],
    ParentType,
    ContextType,
    RequireFields<QuerySessionsArgs, 'first'>
  >;
  teams?: Resolver<
    Array<ResolversTypes['Team']>,
    ParentType,
    ContextType,
    RequireFields<QueryTeamsArgs, 'workspaceId'>
  >;
  thread?: Resolver<
    ResolversTypes['MessageConnection'],
    ParentType,
    ContextType,
    RequireFields<QueryThreadArgs, 'first' | 'rootMessageId'>
  >;
  workspace?: Resolver<
    Maybe<ResolversTypes['Workspace']>,
    ParentType,
    ContextType,
    RequireFields<QueryWorkspaceArgs, 'id'>
  >;
  workspaces?: Resolver<Array<ResolversTypes['Workspace']>, ParentType, ContextType>;
};

export type ReactionSummaryResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['ReactionSummary'] =
    ResolversParentTypes['ReactionSummary'],
> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  emoji?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reactedByMe?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type ReadStateResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['ReadState'] =
    ResolversParentTypes['ReadState'],
> = {
  conversationId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  sequence?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
};

export type ReadStatePayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['ReadStatePayload'] =
    ResolversParentTypes['ReadStatePayload'],
> = {
  errors?: Resolver<Array<ResolversTypes['OperationError']>, ParentType, ContextType>;
  idempotencyKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  readState?: Resolver<Maybe<ResolversTypes['ReadState']>, ParentType, ContextType>;
};

export type RecordingResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Recording'] =
    ResolversParentTypes['Recording'],
> = {
  callId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  fileId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type RoleResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Role'] = ResolversParentTypes['Role'],
> = {
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  permissions?: Resolver<Array<ResolversTypes['Permission']>, ParentType, ContextType>;
  systemRole?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SearchConnectionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['SearchConnection'] =
    ResolversParentTypes['SearchConnection'],
> = {
  edges?: Resolver<Array<ResolversTypes['SearchEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
};

export type SearchEdgeResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['SearchEdge'] =
    ResolversParentTypes['SearchEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['SearchResult'], ParentType, ContextType>;
};

export type SearchResultResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['SearchResult'] =
    ResolversParentTypes['SearchResult'],
> = {
  snippet?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sourceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  sourceType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sourceVersion?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  workspaceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type SessionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Session'] = ResolversParentTypes['Session'],
> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  device?: Resolver<Maybe<ResolversTypes['Device']>, ParentType, ContextType>;
  expiresAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastSeenAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SessionConnectionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['SessionConnection'] =
    ResolversParentTypes['SessionConnection'],
> = {
  edges?: Resolver<Array<ResolversTypes['SessionEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
};

export type SessionEdgeResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['SessionEdge'] =
    ResolversParentTypes['SessionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Session'], ParentType, ContextType>;
};

export type SessionPayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['SessionPayload'] =
    ResolversParentTypes['SessionPayload'],
> = {
  errors?: Resolver<Array<ResolversTypes['OperationError']>, ParentType, ContextType>;
  idempotencyKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  session?: Resolver<Maybe<ResolversTypes['Session']>, ParentType, ContextType>;
};

export type TeamResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Team'] = ResolversParentTypes['Team'],
> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  workspaceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type TeamPayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['TeamPayload'] =
    ResolversParentTypes['TeamPayload'],
> = {
  errors?: Resolver<Array<ResolversTypes['OperationError']>, ParentType, ContextType>;
  idempotencyKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  team?: Resolver<Maybe<ResolversTypes['Team']>, ParentType, ContextType>;
};

export type UserResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User'],
> = {
  avatarFileId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  login?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['UserStatus'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserPayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['UserPayload'] =
    ResolversParentTypes['UserPayload'],
> = {
  errors?: Resolver<Array<ResolversTypes['OperationError']>, ParentType, ContextType>;
  idempotencyKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
};

export type WorkspaceResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Workspace'] =
    ResolversParentTypes['Workspace'],
> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  myMembership?: Resolver<ResolversTypes['Membership'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  policy?: Resolver<ResolversTypes['WorkspacePolicy'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspacePayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['WorkspacePayload'] =
    ResolversParentTypes['WorkspacePayload'],
> = {
  errors?: Resolver<Array<ResolversTypes['OperationError']>, ParentType, ContextType>;
  idempotencyKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  workspace?: Resolver<Maybe<ResolversTypes['Workspace']>, ParentType, ContextType>;
};

export type WorkspacePolicyResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['WorkspacePolicy'] =
    ResolversParentTypes['WorkspacePolicy'],
> = {
  channelRules?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  fileRules?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  guestPolicy?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  mfaRequired?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  retentionDays?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['Long'], ParentType, ContextType>;
  workspaceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  AdminDashboard?: AdminDashboardResolvers<ContextType>;
  Attachment?: AttachmentResolvers<ContextType>;
  AuditEvent?: AuditEventResolvers<ContextType>;
  AuditEventConnection?: AuditEventConnectionResolvers<ContextType>;
  AuditEventEdge?: AuditEventEdgeResolvers<ContextType>;
  Call?: CallResolvers<ContextType>;
  CallParticipant?: CallParticipantResolvers<ContextType>;
  CallPayload?: CallPayloadResolvers<ContextType>;
  Conversation?: ConversationResolvers<ContextType>;
  ConversationConnection?: ConversationConnectionResolvers<ContextType>;
  ConversationEdge?: ConversationEdgeResolvers<ContextType>;
  ConversationPayload?: ConversationPayloadResolvers<ContextType>;
  ConversationStats?: ConversationStatsResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Device?: DeviceResolvers<ContextType>;
  File?: FileResolvers<ContextType>;
  FilePayload?: FilePayloadResolvers<ContextType>;
  Invitation?: InvitationResolvers<ContextType>;
  InvitationPayload?: InvitationPayloadResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Long?: GraphQLScalarType;
  Membership?: MembershipResolvers<ContextType>;
  MembershipConnection?: MembershipConnectionResolvers<ContextType>;
  MembershipEdge?: MembershipEdgeResolvers<ContextType>;
  MembershipPayload?: MembershipPayloadResolvers<ContextType>;
  Message?: MessageResolvers<ContextType>;
  MessageConnection?: MessageConnectionResolvers<ContextType>;
  MessageEdge?: MessageEdgeResolvers<ContextType>;
  MessagePayload?: MessagePayloadResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Node?: NodeResolvers<ContextType>;
  Notification?: NotificationResolvers<ContextType>;
  NotificationConnection?: NotificationConnectionResolvers<ContextType>;
  NotificationEdge?: NotificationEdgeResolvers<ContextType>;
  NotificationPayload?: NotificationPayloadResolvers<ContextType>;
  OperationError?: OperationErrorResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Permission?: PermissionResolvers<ContextType>;
  PolicyPayload?: PolicyPayloadResolvers<ContextType>;
  Presence?: PresenceResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  ReactionSummary?: ReactionSummaryResolvers<ContextType>;
  ReadState?: ReadStateResolvers<ContextType>;
  ReadStatePayload?: ReadStatePayloadResolvers<ContextType>;
  Recording?: RecordingResolvers<ContextType>;
  Role?: RoleResolvers<ContextType>;
  SearchConnection?: SearchConnectionResolvers<ContextType>;
  SearchEdge?: SearchEdgeResolvers<ContextType>;
  SearchResult?: SearchResultResolvers<ContextType>;
  Session?: SessionResolvers<ContextType>;
  SessionConnection?: SessionConnectionResolvers<ContextType>;
  SessionEdge?: SessionEdgeResolvers<ContextType>;
  SessionPayload?: SessionPayloadResolvers<ContextType>;
  Team?: TeamResolvers<ContextType>;
  TeamPayload?: TeamPayloadResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserPayload?: UserPayloadResolvers<ContextType>;
  Workspace?: WorkspaceResolvers<ContextType>;
  WorkspacePayload?: WorkspacePayloadResolvers<ContextType>;
  WorkspacePolicy?: WorkspacePolicyResolvers<ContextType>;
};
