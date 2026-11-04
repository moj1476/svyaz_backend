import type {
  AuditEvent,
  Conversation,
  Membership,
  Message,
  Notification,
  RequestContext,
  SearchDocument,
  ServiceName,
} from './index';
import type {
  AuditFilterInput,
  ConversationFilter,
  ConversationSort,
  EventSort,
  MembershipFilter,
  MemberSort,
  MessageFilter,
  MessageSort,
  NotificationFilter,
  SearchInput,
  SearchSort,
} from './inputs';

export interface PageRequest {
  first?: number | null;
  after?: string | null;
}

export interface Connection<T> {
  edges: { cursor: string; node: T }[];
  pageInfo: { endCursor: string | null; hasNextPage: boolean };
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface ConversationStats {
  conversationId: string;
  messageCount: number;
  replyCount: number;
  deletedCount: number;
  participantCount: number;
  unreadCount: number;
  lastSequence: string;
}

export interface QueryDefinitions {
  members: {
    input: PageRequest & {
      workspaceId: string;
      filter?: MembershipFilter | null;
      sort?: MemberSort | null;
    };
    output: Connection<Membership>;
  };
  conversations: {
    input: PageRequest & {
      workspaceId: string;
      filter?: ConversationFilter | null;
      sort?: ConversationSort | null;
    };
    output: Connection<Conversation>;
  };
  messages: {
    input: PageRequest & {
      conversationId: string;
      filter?: MessageFilter | null;
      sort?: MessageSort | null;
    };
    output: Connection<Message>;
  };
  thread: {
    input: PageRequest & {
      rootMessageId: string;
      filter?: MessageFilter | null;
      sort?: MessageSort | null;
    };
    output: Connection<Message>;
  };
  notifications: {
    input: PageRequest & {
      workspaceId?: string | null;
      unreadOnly?: boolean | null;
      filter?: NotificationFilter | null;
      sort?: EventSort | null;
    };
    output: Connection<Notification>;
  };
  search: {
    input: PageRequest & { input: SearchInput; sort?: SearchSort | null };
    output: Connection<SearchDocument>;
  };
  auditEvents: {
    input: PageRequest & { filter: AuditFilterInput; sort?: EventSort | null };
    output: Connection<AuditEvent>;
  };
  conversationStats: { input: { conversationId: string }; output: ConversationStats };
  messageReactions: { input: { messageId: string }; output: ReactionSummary[] };
}

export type QueryName = keyof QueryDefinitions;

export type QueryInput<N extends QueryName> = QueryDefinitions[N]['input'];

export type QueryOutput<N extends QueryName> = QueryDefinitions[N]['output'];

export const queryOwners = {
  members: 'workspace',
  conversations: 'messaging',
  messages: 'messaging',
  thread: 'messaging',
  notifications: 'notifications',
  search: 'search',
  auditEvents: 'audit',
  conversationStats: 'messaging',
  messageReactions: 'messaging',
} as const satisfies Record<QueryName, ServiceName>;

export function isQueryName(name: string): name is QueryName {
  return Object.hasOwn(queryOwners, name);
}

export interface QueryClient {
  query<N extends QueryName>(
    name: N,
    input: QueryInput<N>,
    context: RequestContext,
  ): Promise<QueryOutput<N>>;
}

export type ServiceQuery<S extends ServiceName> = {
  [N in QueryName]: (typeof queryOwners)[N] extends S ? N : never;
}[QueryName];
