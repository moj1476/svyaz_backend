import { randomUUID } from 'node:crypto';
import type { LocalRuntime } from '../local-runtime';
import type { QueryContext } from './query-context';

export class GraphQLContext {
  readonly requestId = randomUUID();
  private pending?: Promise<QueryContext>;

  constructor(
    readonly runtime: LocalRuntime,
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
