import { record } from '../../contracts/src/validation';
import type { DomainEvent, CommandEvents } from '../../contracts/src/events';
import type {
  DataMap,
  RequestContext,
  ServiceClient,
  ServiceName,
} from '../../contracts/src';
import type { AccessClient } from '../../contracts/src/access';
import type {
  CommandInput,
  CommandName,
  CommandOutput,
  CommandResult,
  ServiceCommand,
} from '../../contracts/src/command-map';
import { mutationOwners } from '../../contracts/src/command-map';
import type { TransactionStore } from '../../contracts/src/commands';
import { DomainError } from '../../contracts/src/errors';
import { parseCommandInput } from '../../contracts/src/parse-input';
import { queryDispatcher } from './query-dispatch';

export type CommandHandler<N extends CommandName, S extends ServiceName> = (
  input: CommandInput<N>,
  context: RequestContext,
  data: DataMap[S],
) => Promise<CommandOutput<N>>;

export type CommandHandlers<S extends ServiceName> = {
  [N in ServiceCommand<S>]: CommandHandler<N, S>;
};

export class ServiceBase<S extends ServiceName> implements ServiceClient<S> {
  constructor(
    readonly name: S,
    protected readonly store: TransactionStore<DataMap[S]>,
    protected readonly access: AccessClient,
    private readonly reader: ServiceClient<S>,
    private readonly handlers: CommandHandlers<S>,
    private readonly events: CommandEvents<S>,
    private readonly authorize: (
      operation: string,
      input: Record<string, unknown>,
      context: RequestContext,
    ) => Promise<void>,
  ) {}

  snapshot(context: RequestContext) {
    return this.reader.snapshot(context);
  }

  async execute<N extends CommandName>(
    operation: N,
    input: CommandInput<N>,
    context: RequestContext,
  ): Promise<CommandResult<N>> {
    const owner: ServiceName = mutationOwners[operation];

    if (owner !== this.name)
      throw new DomainError('VALIDATION', 'Команда принадлежит другому сервису');

    const normalized = record(parseCommandInput(operation, input));
    const run = async (): Promise<CommandResult<N>> => {
      await this.authorize(operation, normalized, context);

      const handler = (this.handlers as Partial<Record<CommandName, unknown>>)[
        operation
      ] as CommandHandler<N, S>;

      if (!handler) throw new DomainError('VALIDATION', 'Обработчик команды отсутствует');

      return this.store.transact(context, operation, normalized, async (data, outbox) => {
        const output = await handler(normalized as CommandInput<N>, context, data);
        const events = (this.events as Partial<Record<CommandName, unknown>>)[
          operation
        ] as (
          input: CommandInput<N>,
          output: CommandOutput<N>,
          context: RequestContext,
          data: Readonly<DataMap[S]>,
        ) => DomainEvent[];

        for (const event of events(normalized as CommandInput<N>, output, context, data))
          outbox.append(event);

        return {
          ...output,
          errors: [],
          idempotencyKey:
            typeof normalized.idempotencyKey === 'string'
              ? normalized.idempotencyKey
              : typeof normalized.actionId === 'string'
                ? normalized.actionId
                : null,
        };
      });
    };

    return this.store.withOperation
      ? this.store.withOperation(context, operation, normalized, run)
      : run();
  }

  query = queryDispatcher({});

  async statistics(
    _workspaceId: string,
    _context: RequestContext,
  ): Promise<import('../../contracts/src/statistics').ServiceStatistics<S>> {
    throw new DomainError('VALIDATION', 'Агрегат не поддерживается');
  }
}
