import { Inject } from '@nestjs/common';
import { Command, CommandHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { CLIENTS, type Clients } from '#contracts';
import { isCommandName, type CommandInput } from '#contracts/command-map';
import { DomainError } from '#contracts/errors';
import { executeClient } from '#runtime/client-dispatch';
import type { QueryContext } from '../context/query-context';
import { RequestData } from '../context/request-data';
import { Access } from './access';
import { query, type Args } from './queries';

export class ApiMutation extends Command<unknown> {
  constructor(
    readonly name: string,
    readonly args: Record<string, unknown>,
    readonly context: QueryContext,
  ) {
    super();
  }
}

export class ApiQuery extends Query<unknown> {
  constructor(
    readonly name: string,
    readonly args: Args,
    readonly context: QueryContext,
  ) {
    super();
  }
}

@CommandHandler(ApiMutation)
export class ApiMutationHandler {
  constructor(
    @Inject(CLIENTS) private readonly clients: Clients,
    @Inject(RequestData) private readonly data: RequestData,
  ) {}

  async execute({ name, args, context }: ApiMutation) {
    if (!isCommandName(name))
      throw new DomainError('VALIDATION', 'Неизвестная операция изменения данных');

    const input = (args.input ?? args) as Record<string, unknown>;

    try {
      const result = await executeClient(
        this.clients,
        name,
        input as CommandInput<typeof name>,
        context,
      );

      context.cache.clear();
      this.data.prepareContext(context);

      return result;
    } catch (error) {
      if (error instanceof DomainError)
        return {
          errors: [
            {
              code: error.code,
              message: error.message,
              field: error.field,
              retryable: error.code === 'UNAVAILABLE',
            },
          ],
          idempotencyKey: input.idempotencyKey ?? input.actionId ?? null,
        };

      throw error;
    }
  }
}

@QueryHandler(ApiQuery)
export class ApiQueryHandler {
  private readonly access: Access;

  constructor(
    @Inject(CLIENTS) private readonly clients: Clients,
    @Inject(RequestData) private readonly data: RequestData,
  ) {
    this.access = new Access(data);
  }

  execute({ name, args, context }: ApiQuery) {
    return query(this.clients, this.data, this.access, name, args, context);
  }
}
