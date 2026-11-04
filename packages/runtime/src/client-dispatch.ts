import type { Clients, RequestContext } from '../../contracts/src';
import {
  mutationOwners,
  type CommandName,
  type CommandClient,
  type CommandInput,
  type CommandResult,
} from '../../contracts/src/command-map';
import {
  queryOwners,
  type QueryName,
  type QueryClient,
  type QueryInput,
  type QueryOutput,
} from '../../contracts/src/queries';
import { DomainError } from '../../contracts/src/errors';

export function executeClient<N extends CommandName>(
  clients: Clients,
  name: N,
  input: CommandInput<N>,
  context: RequestContext,
): Promise<CommandResult<N>> {
  const client = clients[mutationOwners[name]];

  if (!client.execute)
    throw new DomainError('VALIDATION', 'Обработчик команды отсутствует');

  return (client as CommandClient).execute(name, input, context);
}

export function queryClient<N extends QueryName>(
  clients: Clients,
  name: N,
  input: QueryInput<N>,
  context: RequestContext,
): Promise<QueryOutput<N>> {
  const client = clients[queryOwners[name]];

  if (!client.query)
    throw new DomainError('VALIDATION', 'Обработчик запроса отсутствует');

  return (client as QueryClient).query(name, input, context);
}
