import { Inject, Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CLIENTS, type Clients } from '#contracts';
import type { QueryContext } from '../context/query-context';
import { RequestData } from '../context/request-data';
import { ApiMutation, ApiQuery } from './api-handlers';
import type { Args } from './queries';

@Injectable()
export class Composition {
  constructor(
    @Inject(CLIENTS) readonly clients: Clients,
    @Inject(RequestData) readonly data: RequestData,
    @Inject(CommandBus) private readonly commands: CommandBus,
    @Inject(QueryBus) private readonly queries: QueryBus,
  ) {}

  query(name: string, args: Args, context: QueryContext) {
    return this.queries.execute(new ApiQuery(name, args, context));
  }

  mutate(name: string, args: Record<string, unknown>, context: QueryContext) {
    return this.commands.execute(new ApiMutation(name, args, context));
  }
}
