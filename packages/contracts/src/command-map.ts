import type {
  User,
  Session,
  Workspace,
  Membership,
  Team,
  Policy,
  Conversation,
  Message,
  Notification,
  Call,
  FileRecord,
  WorkspaceData,
  RequestContext,
  ServiceName,
} from './index';
import type * as Input from './inputs';
import { mutationOwners } from './ownership';
export { mutationOwners } from './ownership';
export type Invitation = NonNullable<WorkspaceData['invitations']>[number];
export interface ReadState {
  conversationId: string;
  sequence: string;
}
export interface OperationError {
  code: string;
  message: string;
  field: string | null;
  retryable: boolean;
}
export interface CommandDefinitions {
  inviteMember: { input: Input.InviteMemberInput; output: { invitation: Invitation } };
  acceptInvitation: {
    input: { readonly invitationId: string; readonly idempotencyKey: string };
    output: { membership: Membership };
  };
  updateProfile: { input: Input.UpdateProfileInput; output: { user: User } };
  revokeSession: {
    input: { readonly sessionId: string; readonly idempotencyKey: string };
    output: { session: Session };
  };
  createWorkspace: {
    input: Input.CreateWorkspaceInput;
    output: { workspace: Workspace };
  };
  createTeam: {
    input: {
      readonly workspaceId: string;
      readonly name: string;
      readonly description?: string | null;
      readonly idempotencyKey: string;
    };
    output: { team: Team };
  };
  assignTeamMember: {
    input: {
      readonly workspaceId: string;
      readonly teamId: string;
      readonly membershipId: string;
      readonly active: boolean;
    };
    output: { team: Team };
  };
  changeMemberRole: {
    input: Input.ChangeMemberRoleInput;
    output: { membership: Membership };
  };
  deactivateMember: {
    input: {
      readonly workspaceId: string;
      readonly membershipId: string;
      readonly expectedVersion: string;
      readonly actionId: string;
    };
    output: { membership: Membership };
  };
  updateWorkspacePolicy: {
    input: Input.UpdateWorkspacePolicyInput;
    output: { policy: Policy };
  };
  createConversation: {
    input: Input.CreateConversationInput;
    output: { conversation: Conversation };
  };
  updateConversation: {
    input: Input.UpdateConversationInput;
    output: { conversation: Conversation };
  };
  addConversationMember: {
    input: { readonly conversationId: string; readonly userId: string };
    output: { conversation: Conversation };
  };
  archiveConversation: {
    input: {
      readonly conversationId: string;
      readonly expectedVersion: string;
      readonly actionId: string;
    };
    output: { conversation: Conversation };
  };
  sendMessage: { input: Input.SendMessageInput; output: { message: Message } };
  editMessage: { input: Input.EditMessageInput; output: { message: Message } };
  deleteMessage: {
    input: {
      readonly messageId: string;
      readonly expectedVersion: string;
      readonly idempotencyKey: string;
    };
    output: { message: Message };
  };
  markRead: { input: Input.MarkReadInput; output: { readState: ReadState } };
  setReaction: { input: Input.SetReactionInput; output: { message: Message } };
  markNotificationRead: {
    input: { readonly id: string; readonly read: boolean };
    output: { notification: Notification };
  };
  startCall: { input: Input.StartCallInput; output: { call: Call } };
  joinCall: {
    input: { readonly callId: string; readonly idempotencyKey: string };
    output: { call: Call };
  };
  leaveCall: {
    input: { readonly callId: string; readonly idempotencyKey: string };
    output: { call: Call };
  };
  endCall: {
    input: { readonly callId: string; readonly idempotencyKey: string };
    output: { call: Call };
  };
  deleteFile: {
    input: {
      readonly fileId: string;
      readonly reason: string;
      readonly idempotencyKey: string;
    };
    output: { file: FileRecord };
  };
}
export type CommandName = keyof CommandDefinitions;
export type CommandInput<N extends CommandName> = CommandDefinitions[N]['input'];
export type CommandOutput<N extends CommandName> = CommandDefinitions[N]['output'];
export type CommandResult<N extends CommandName> = CommandOutput<N> & {
  errors: OperationError[];
  idempotencyKey: string | null;
};
export type ServiceCommand<S extends ServiceName> = {
  [N in CommandName]: (typeof mutationOwners)[N] extends S ? N : never;
}[CommandName];
export function isCommandName(name: string): name is CommandName {
  return Object.hasOwn(mutationOwners, name);
}
export interface CommandClient {
  execute<N extends CommandName>(
    operation: N,
    input: CommandInput<N>,
    context: RequestContext,
  ): Promise<CommandResult<N>>;
}
