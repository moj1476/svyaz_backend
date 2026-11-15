import { wireScalars } from './wire-scalars';
import * as z from 'zod';
import * as Types from './graphql-types';

type Properties<T> = {
  [K in keyof T]: z.ZodType<T[K], T[K] | undefined>;
};

type definedNonNullAny = {};

export const isDefinedNonNullAny = (v: any): v is definedNonNullAny =>
  v !== undefined && v !== null;

export const definedNonNullAnySchema = z.any().refine((v) => isDefinedNonNullAny(v));

export const CallModeSchema: z.ZodType<'AUDIO' | 'VIDEO', 'AUDIO' | 'VIDEO'> = z.enum([
  'AUDIO',
  'VIDEO',
]);

export const CallStatusSchema: z.ZodType<
  'ACTIVE' | 'ENDED' | 'FAILED' | 'RINGING',
  'ACTIVE' | 'ENDED' | 'FAILED' | 'RINGING'
> = z.enum(['ACTIVE', 'ENDED', 'FAILED', 'RINGING']);

export const ConversationSortFieldSchema: z.ZodType<
  'ID' | 'TITLE' | 'TYPE',
  'ID' | 'TITLE' | 'TYPE'
> = z.enum(['ID', 'TITLE', 'TYPE']);

export const ConversationStatusSchema: z.ZodType<
  'ACTIVE' | 'ARCHIVED',
  'ACTIVE' | 'ARCHIVED'
> = z.enum(['ACTIVE', 'ARCHIVED']);

export const ConversationTypeSchema: z.ZodType<
  'CHANNEL' | 'DIRECT' | 'GROUP',
  'CHANNEL' | 'DIRECT' | 'GROUP'
> = z.enum(['CHANNEL', 'DIRECT', 'GROUP']);

export const ConversationVisibilitySchema: z.ZodType<
  'PRIVATE' | 'PUBLIC',
  'PRIVATE' | 'PUBLIC'
> = z.enum(['PRIVATE', 'PUBLIC']);

export const EventSortFieldSchema: z.ZodType<'CREATED_AT' | 'ID', 'CREATED_AT' | 'ID'> =
  z.enum(['CREATED_AT', 'ID']);

export const FileStatusSchema: z.ZodType<
  'DELETED' | 'PENDING' | 'QUARANTINED' | 'READY',
  'DELETED' | 'PENDING' | 'QUARANTINED' | 'READY'
> = z.enum(['DELETED', 'PENDING', 'QUARANTINED', 'READY']);

export const MemberSortFieldSchema: z.ZodType<'ID' | 'JOINED_AT', 'ID' | 'JOINED_AT'> =
  z.enum(['ID', 'JOINED_AT']);

export const MemberStatusSchema: z.ZodType<
  'ACTIVE' | 'INVITED' | 'REMOVED' | 'SUSPENDED',
  'ACTIVE' | 'INVITED' | 'REMOVED' | 'SUSPENDED'
> = z.enum(['ACTIVE', 'INVITED', 'REMOVED', 'SUSPENDED']);

export const MessageSortFieldSchema: z.ZodType<
  'ID' | 'SENT_AT' | 'SEQUENCE',
  'ID' | 'SENT_AT' | 'SEQUENCE'
> = z.enum(['ID', 'SENT_AT', 'SEQUENCE']);

export const MessageStatusSchema: z.ZodType<
  'DELETED' | 'EDITED' | 'SENT',
  'DELETED' | 'EDITED' | 'SENT'
> = z.enum(['DELETED', 'EDITED', 'SENT']);

export const SearchSortFieldSchema: z.ZodType<'ID' | 'TITLE', 'ID' | 'TITLE'> = z.enum([
  'ID',
  'TITLE',
]);

export const SortDirectionSchema: z.ZodType<'ASC' | 'DESC', 'ASC' | 'DESC'> = z.enum([
  'ASC',
  'DESC',
]);

export const UserStatusSchema: z.ZodType<
  'ACTIVE' | 'DELETED' | 'DISABLED' | 'PENDING',
  'ACTIVE' | 'DELETED' | 'DISABLED' | 'PENDING'
> = z.enum(['ACTIVE', 'DELETED', 'DISABLED', 'PENDING']);

export function AuditFilterInputSchema(): z.ZodObject<
  Properties<Types.AuditFilterInput>
> {
  return z
    .object({
      actions: z.array(z.string()).nullish(),
      actorId: wireScalars.ID.nullish(),
      from: wireScalars.DateTime.nullish(),
      targetType: z.string().nullish(),
      to: wireScalars.DateTime.nullish(),
      workspaceId: wireScalars.ID,
    })
    .strict();
}

export function ChangeMemberRoleInputSchema(): z.ZodObject<
  Properties<Types.ChangeMemberRoleInput>
> {
  return z
    .object({
      actionId: z.string(),
      expectedVersion: wireScalars.Long,
      membershipId: wireScalars.ID,
      roleId: wireScalars.ID,
      workspaceId: wireScalars.ID,
    })
    .strict();
}

export function ConversationFilterSchema(): z.ZodObject<
  Properties<Types.ConversationFilter>
> {
  return z
    .object({
      status: ConversationStatusSchema.nullish(),
      text: z.string().nullish(),
      type: ConversationTypeSchema.nullish(),
      visibility: ConversationVisibilitySchema.nullish(),
    })
    .strict();
}

export function ConversationSortSchema(): z.ZodType<Types.ConversationSort> {
  return z
    .object({
      direction: SortDirectionSchema.default('ASC').nullish(),
      field: ConversationSortFieldSchema.default('ID').nullish(),
    })
    .strict();
}

export function CreateConversationInputSchema(): z.ZodObject<
  Properties<Types.CreateConversationInput>
> {
  return z
    .object({
      idempotencyKey: z.string(),
      memberIds: z.array(wireScalars.ID),
      title: z.string().nullish(),
      type: ConversationTypeSchema,
      visibility: ConversationVisibilitySchema,
      workspaceId: wireScalars.ID,
    })
    .strict();
}

export function CreateWorkspaceInputSchema(): z.ZodObject<
  Properties<Types.CreateWorkspaceInput>
> {
  return z
    .object({
      idempotencyKey: z.string(),
      name: z.string(),
      slug: z.string(),
    })
    .strict();
}

export function EditMessageInputSchema(): z.ZodObject<
  Properties<Types.EditMessageInput>
> {
  return z
    .object({
      body: z.string(),
      expectedVersion: wireScalars.Long,
      idempotencyKey: z.string(),
      messageId: wireScalars.ID,
    })
    .strict();
}

export function EventSortSchema(): z.ZodType<Types.EventSort> {
  return z
    .object({
      direction: SortDirectionSchema.default('ASC').nullish(),
      field: EventSortFieldSchema.default('CREATED_AT').nullish(),
    })
    .strict();
}

export function InviteMemberInputSchema(): z.ZodObject<
  Properties<Types.InviteMemberInput>
> {
  return z
    .object({
      expiresAt: wireScalars.DateTime,
      idempotencyKey: z.string(),
      roleId: wireScalars.ID,
      userId: wireScalars.ID,
      workspaceId: wireScalars.ID,
    })
    .strict();
}

export function MarkReadInputSchema(): z.ZodObject<Properties<Types.MarkReadInput>> {
  return z
    .object({
      conversationId: wireScalars.ID,
      sequence: wireScalars.Long,
    })
    .strict();
}

export function MemberSortSchema(): z.ZodType<Types.MemberSort> {
  return z
    .object({
      direction: SortDirectionSchema.default('ASC').nullish(),
      field: MemberSortFieldSchema.default('ID').nullish(),
    })
    .strict();
}

export function MembershipFilterSchema(): z.ZodObject<
  Properties<Types.MembershipFilter>
> {
  return z
    .object({
      roleId: wireScalars.ID.nullish(),
      status: MemberStatusSchema.nullish(),
      userId: wireScalars.ID.nullish(),
    })
    .strict();
}

export function MessageFilterSchema(): z.ZodObject<Properties<Types.MessageFilter>> {
  return z
    .object({
      from: wireScalars.DateTime.nullish(),
      senderId: wireScalars.ID.nullish(),
      status: MessageStatusSchema.nullish(),
      text: z.string().nullish(),
      to: wireScalars.DateTime.nullish(),
    })
    .strict();
}

export function MessageSortSchema(): z.ZodType<Types.MessageSort> {
  return z
    .object({
      direction: SortDirectionSchema.default('ASC').nullish(),
      field: MessageSortFieldSchema.default('SEQUENCE').nullish(),
    })
    .strict();
}

export function NotificationFilterSchema(): z.ZodObject<
  Properties<Types.NotificationFilter>
> {
  return z
    .object({
      from: wireScalars.DateTime.nullish(),
      to: wireScalars.DateTime.nullish(),
      type: z.string().nullish(),
    })
    .strict();
}

export function SearchInputSchema(): z.ZodType<Types.SearchInput> {
  return z
    .object({
      conversationIds: z.array(wireScalars.ID).nullish(),
      from: wireScalars.DateTime.nullish(),
      text: z.string(),
      to: wireScalars.DateTime.nullish(),
      types: z.array(z.string()).default(['MESSAGE', 'FILE', 'USER', 'CHANNEL']),
      workspaceId: wireScalars.ID,
    })
    .strict();
}

export function SearchSortSchema(): z.ZodType<Types.SearchSort> {
  return z
    .object({
      direction: SortDirectionSchema.default('ASC').nullish(),
      field: SearchSortFieldSchema.default('ID').nullish(),
    })
    .strict();
}

export function SendMessageInputSchema(): z.ZodType<Types.SendMessageInput> {
  return z
    .object({
      body: z.string(),
      clientMessageId: wireScalars.ID,
      conversationId: wireScalars.ID,
      fileIds: z.array(wireScalars.ID).default([]),
      threadRootId: wireScalars.ID.nullish(),
    })
    .strict();
}

export function SetReactionInputSchema(): z.ZodObject<
  Properties<Types.SetReactionInput>
> {
  return z
    .object({
      active: wireScalars.Boolean,
      emoji: z.string(),
      messageId: wireScalars.ID,
    })
    .strict();
}

export function StartCallInputSchema(): z.ZodType<Types.StartCallInput> {
  return z
    .object({
      conversationId: wireScalars.ID,
      idempotencyKey: z.string(),
      inviteeIds: z.array(wireScalars.ID).default([]),
      mode: CallModeSchema,
    })
    .strict();
}

export function UpdateConversationInputSchema(): z.ZodObject<
  Properties<Types.UpdateConversationInput>
> {
  return z
    .object({
      conversationId: wireScalars.ID,
      expectedVersion: wireScalars.Long,
      idempotencyKey: z.string(),
      title: z.string(),
    })
    .strict();
}

export function UpdateProfileInputSchema(): z.ZodObject<
  Properties<Types.UpdateProfileInput>
> {
  return z
    .object({
      avatarFileId: wireScalars.ID.nullish(),
      displayName: z.string().nullish(),
      expectedVersion: wireScalars.Long,
      idempotencyKey: z.string(),
    })
    .strict();
}

export function UpdateWorkspacePolicyInputSchema(): z.ZodObject<
  Properties<Types.UpdateWorkspacePolicyInput>
> {
  return z
    .object({
      actionId: z.string(),
      channelRules: wireScalars.JSON.nullish(),
      expectedVersion: wireScalars.Long,
      fileRules: wireScalars.JSON.nullish(),
      guestPolicy: wireScalars.JSON.nullish(),
      mfaRequired: wireScalars.Boolean.nullish(),
      retentionDays: wireScalars.Int.nullish(),
      workspaceId: wireScalars.ID,
    })
    .strict();
}
