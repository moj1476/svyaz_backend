import { randomUUID } from 'node:crypto';
import type { GatewayRuntime } from '../gateway-runtime';
import type { QueryContext } from './query-context';

export class GraphQLContext {
  readonly requestId = randomUUID();
  private pending?: Promise<QueryContext>;

  constructor(
    readonly runtime: GatewayRuntime,
    private readonly authorization: string | undefined,
    readonly ip: string,
  ) {}

  authenticated() {
    this.pending ??= this.runtime.auth
      .authenticate(this.authorization, this.requestId)
      .then((identity) => ({
        ...identity,
        cache: new Map(),
      }));
    return this.pending;
  }

  invalidate() {
    this.pending = undefined;
  }
}
