import type {
  RequestContext,
  ServiceName,
  User,
} from '../../../../packages/contracts/src';
import type { BatchLoader } from '../../../../packages/runtime/src/batch-loader';
export interface QueryContext extends RequestContext {
  failed?: ServiceName;
  users?: BatchLoader<string, User | null>;
  cache: Map<ServiceName, Promise<unknown>>;
}
