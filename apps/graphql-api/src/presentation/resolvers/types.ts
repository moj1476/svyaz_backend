import { DomainError } from '#contracts/errors';
import type { QueryContext } from '../../context/query-context';
import type { PageArgs } from '#contracts/pagination';
import type { Resolvers } from '#contracts/graphql-types';
export type Resolver = (
  parent: unknown,
  args: Record<string, unknown> & PageArgs,
  context: QueryContext,
) => Promise<unknown>;
export type FieldResolvers = Pick<
  Resolvers<QueryContext>,
  | 'Workspace'
  | 'Membership'
  | 'Role'
  | 'Session'
  | 'Conversation'
  | 'Message'
  | 'Attachment'
  | 'File'
  | 'Call'
  | 'CallParticipant'
>;

export function requiredRelation<T>(value: T | null | undefined): T {
  if (value == null) throw new DomainError('NOT_FOUND', 'Связанный объект не найден');
  return value;
}
