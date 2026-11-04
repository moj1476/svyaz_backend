import type { DataMap } from './index';
import type { CommandInput, CommandOutput, ServiceCommand } from './command-map';
import type { ServiceName } from './index';
import { randomUUID } from 'node:crypto';
import type { RequestContext } from './index';

export interface DomainEvent {
  readonly id: string;
  readonly type: string;
  readonly schemaVersion: 1;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly workspaceId: string | null;
  readonly occurredAt: string;
  readonly actorId: string;
  readonly requestId: string;
  readonly payload: Readonly<Record<string, string | number | boolean | null>>;
}

export interface OutboxWriter {
  append(event: DomainEvent): void;
}

export function event(
  type: string,
  aggregateType: string,
  aggregateId: string,
  workspaceId: string | null,
  context: RequestContext,
  payload: DomainEvent['payload'] = {},
): DomainEvent {
  return {
    id: randomUUID(),
    type,
    schemaVersion: 1,
    aggregateType,
    aggregateId,
    workspaceId,
    occurredAt: new Date().toISOString(),
    actorId: context.userId,
    requestId: context.requestId,
    payload,
  };
}

export type CommandEvents<S extends ServiceName> = {
  [N in ServiceCommand<S>]: (
    input: CommandInput<N>,
    output: CommandOutput<N>,
    context: RequestContext,
    data: Readonly<DataMap[S]>,
  ) => DomainEvent[];
};
