import { Inject, Injectable } from '@nestjs/common';
import { CLIENTS, type Clients } from '../../../../packages/contracts/src';
import { executeClient } from '../../../../packages/runtime/src/client-dispatch';
import { isCommandName } from '../../../../packages/contracts/src/command-map';
import { mutationOwners } from '../../../../packages/contracts/src/commands';
import { DomainError } from '../../../../packages/contracts/src/errors';
import { parseCommandInput } from '../../../../packages/contracts/src/parse-input';
import type { QueryContext } from '../context/query-context';
import { RequestData } from '../context/request-data';
import { Access } from './access';
import { query, type Args } from './queries';
@Injectable()
export class Composition {
  readonly data: RequestData;
  private readonly access: Access;
  constructor(@Inject(CLIENTS) readonly clients: Clients) {
    this.data = new RequestData(clients);
    this.access = new Access(this.data);
  }
  query(name: string, args: Args, context: QueryContext) {
    return query(this.clients, this.data, this.access, name, args, context);
  }
  async mutate(name: string, args: Record<string, unknown>, context: QueryContext) {
    if (!isCommandName(name))
      throw new DomainError('VALIDATION', 'Неизвестная операция изменения данных');

    const owner = mutationOwners[name];
    const input = (args.input ?? args) as Record<string, unknown>;

    try {
      if (context.failed === owner)
        throw new DomainError('UNAVAILABLE', 'Учебный отказ источника');

      const client = this.clients[owner];

      if (!client.execute)
        throw new DomainError('VALIDATION', 'Операция не поддерживается');

      const result = await executeClient(
        this.clients,
        name,
        parseCommandInput(name, input),
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
