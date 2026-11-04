import type { ConversationType, ConversationVisibility, MessageStatus } from '../inputs';

export interface Conversation {
  createdBy?: string | null;
  id: string;
  workspaceId: string;
  type: ConversationType;
  title: string | null;
  visibility: ConversationVisibility;
  status: string;
  version: string;
}

export interface ConversationMember {
  conversationId: string;
  userId: string;
  status: string;
  joinedSeq: string;
  lastReadSeq: string;
}

export interface Message {
  clientMessageId?: string | null;
  id: string;
  conversationId: string;
  senderId: string;
  sequence: string;
  body: string | null;
  status: MessageStatus;
  threadRootId: string | null;
  sentAt: string;
  editedAt: string | null;
  version: string;
}

export interface Reaction {
  messageId: string;
  userId: string;
  emoji: string;
}

export interface MessagingData {
  revisions?: {
    id: string;
    messageId: string;
    revisionNo: string;
    body: string | null;
    editedAt: string;
  }[];
  conversations: Conversation[];
  conversationMembers: ConversationMember[];
  messages: Message[];
  reactions: Reaction[];
}
