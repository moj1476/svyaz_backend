import type { Conversation, Message } from '../../../../../packages/contracts/src';
import type {
  QueryInput,
  QueryOutput,
} from '../../../../../packages/contracts/src/queries';

export interface MessagingReadRepository {
  getConversationForUser(
    conversationId: string,
    userId: string,
  ): Promise<Conversation | null>;
  getRootMessage(messageId: string): Promise<Message | null>;
  listMessages(
    input: QueryInput<'messages'> | QueryInput<'thread'>,
    conversationId: string,
    rootId: string | null,
    userId: string,
  ): Promise<QueryOutput<'messages'>>;
  listConversations(
    input: QueryInput<'conversations'>,
    userId: string,
  ): Promise<QueryOutput<'conversations'>>;
  conversationStats(
    conversationId: string,
    userId: string,
  ): Promise<QueryOutput<'conversationStats'>>;
}
