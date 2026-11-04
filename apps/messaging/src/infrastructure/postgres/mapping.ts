import type {
  Prisma,
  Conversation as DbConversation,
  ConversationMember as DbConversationMember,
  Message as DbMessage,
  Reaction as DbReaction,
  MessageRevision as DbMessageRevision,
} from '../../../../../generated/messaging/client';
import type { MessagingData } from '../../../../../packages/contracts/src';

type Conversation = NonNullable<MessagingData['conversations']>[number];

type ConversationMember = NonNullable<MessagingData['conversationMembers']>[number];

type Message = NonNullable<MessagingData['messages']>[number];

type Reaction = NonNullable<MessagingData['reactions']>[number];

type MessageRevision = NonNullable<MessagingData['revisions']>[number];

export function fromConversation(row: DbConversation): Conversation {
  return {
    ...row,
    type: row.type as Conversation['type'],
    visibility: row.visibility as Conversation['visibility'],
    status: row.status as Conversation['status'],
    version: row.version.toString(),
  };
}

export function toConversation(
  row: Conversation,
): Prisma.ConversationUncheckedCreateInput {
  return { ...row, version: BigInt(row.version) };
}

export function fromConversationMember(row: DbConversationMember): ConversationMember {
  return {
    ...row,
    status: row.status as ConversationMember['status'],
    joinedSeq: row.joinedSeq.toString(),
    lastReadSeq: row.lastReadSeq.toString(),
  };
}

export function toConversationMember(
  row: ConversationMember,
): Prisma.ConversationMemberUncheckedCreateInput {
  return {
    ...row,
    joinedSeq: BigInt(row.joinedSeq),
    lastReadSeq: BigInt(row.lastReadSeq),
  };
}

export function fromMessage(row: DbMessage): Message {
  return {
    ...row,
    sequence: row.sequence.toString(),
    status: row.status as Message['status'],
    sentAt: row.sentAt.toISOString(),
    editedAt: row.editedAt?.toISOString() ?? null,
    version: row.version.toString(),
  };
}

export function toMessage(row: Message): Prisma.MessageUncheckedCreateInput {
  return {
    ...row,
    sequence: BigInt(row.sequence),
    sentAt: new Date(row.sentAt),
    editedAt: row.editedAt == null ? null : new Date(row.editedAt),
    version: BigInt(row.version),
  };
}

export function fromReaction(row: DbReaction): Reaction {
  return { ...row };
}

export function toReaction(row: Reaction): Prisma.ReactionUncheckedCreateInput {
  return { ...row };
}

export function fromMessageRevision(row: DbMessageRevision): MessageRevision {
  return {
    ...row,
    revisionNo: row.revisionNo.toString(),
    editedAt: row.editedAt.toISOString(),
  };
}

export function toMessageRevision(
  row: MessageRevision,
): Prisma.MessageRevisionUncheckedCreateInput {
  return { ...row, revisionNo: BigInt(row.revisionNo), editedAt: new Date(row.editedAt) };
}
