import type { RequestContext, ServiceName, User } from '#contracts';
import type { AuthenticatedSession } from '#contracts/auth';
import type DataLoader from 'dataloader';
export interface QueryContext
  extends Omit<RequestContext, keyof AuthenticatedSession>, AuthenticatedSession {
  users?: DataLoader<string, User | null>;
  cache: Map<ServiceName, Promise<unknown>>;
}
