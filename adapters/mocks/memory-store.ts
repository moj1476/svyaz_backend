import { commandIdentity } from '../../packages/contracts/src/idempotency';
import type { DomainEvent, OutboxWriter } from '../../packages/contracts/src/events';
import type { RequestContext } from '../../packages/contracts/src';
import { canonical } from '../../packages/contracts/src/canonical';
import type { TransactionStore } from '../../packages/contracts/src/commands';
import { DomainError } from '../../packages/contracts/src/errors';
export class MemoryStore<T> implements TransactionStore<T> {
  private state: T;
  private readonly events: DomainEvent[] = [];
  private tail: Promise<void> = Promise.resolve();
  private ledger = new Map<string, { hash: string; result: unknown }>();

  constructor(data: T) {
    this.state = structuredClone(data);
  }

  async load() {
    await this.tail;

    return structuredClone(this.state);
  }

  async close() {}

  async pendingEvents(limit = 100) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000)
      throw new DomainError('VALIDATION', 'limit от 1 до 1000');

    return structuredClone(this.events.slice(0, limit));
  }

  async transact<R>(
    context: RequestContext,
    operation: string,
    input: Record<string, unknown>,
    work: (draft: T, outbox: OutboxWriter) => Promise<R>,
  ): Promise<R> {
    const previous = this.tail;
    let release!: () => void;

    this.tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;

    try {
      const identity = commandIdentity(context, operation, input),
        old = identity ? this.ledger.get(identity.key) : undefined;

      if (old) {
        if (old.hash !== identity!.hash)
          throw new DomainError(
            'CONFLICT',
            'Ключ повторно использован с другими параметрами',
          );

        return structuredClone(old.result) as R;
      }

      const draft = structuredClone(this.state);
      const pending: DomainEvent[] = [];
      const result = await work(draft, { append: (event) => pending.push(event) });

      if (canonical(this.state) !== canonical(draft)) this.events.push(...pending);

      this.state = draft;

      if (identity)
        this.ledger.set(identity.key, {
          hash: identity.hash,
          result: structuredClone(result),
        });

      return structuredClone(result);
    } finally {
      release();
    }
  }
}
