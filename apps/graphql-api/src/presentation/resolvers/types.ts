import type { QueryContext } from '../../context/query-context';
import type { PageArgs } from '../../../../../packages/contracts/src/pagination';
export type Resolver = (
  parent: unknown,
  args: Record<string, unknown> & PageArgs,
  context: QueryContext,
) => Promise<unknown>;
export type FieldResolvers = Record<string, Record<string, Resolver>>;
