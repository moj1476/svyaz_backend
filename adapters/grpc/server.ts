import type { UntypedServiceImplementation } from '@grpc/grpc-js';
import type { RequestContext, ServiceClient, ServiceName } from '#contracts';
import {
  isCommandName,
  mutationOwners,
  type CommandClient,
} from '#contracts/command-map';
import { isQueryName, queryOwners, type QueryClient } from '#contracts/queries';
import { DomainError, uuid } from '#contracts/errors';
import { parseQueryInput } from '#contracts/parse-input';
import { decode, encode, listen, unary } from './transport';

interface Operation {
  context: RequestContext;
  name: string;
  inputJson: Buffer;
}

export function validateContext(context: RequestContext): RequestContext {
  if (!context) throw new DomainError('VALIDATION', 'Требуется контекст запроса');
  uuid(context.userId);
  uuid(context.requestId);
  if (context.sessionId) uuid(context.sessionId);
  return context;
}

export function serve<K extends ServiceName>(
  service: K,
  application: ServiceClient<K>,
  extra: UntypedServiceImplementation = {},
) {
  const handlers: UntypedServiceImplementation = {
    ping: unary(() => ({})),
    snapshot: unary(async (context: RequestContext) => ({
      dataJson: encode(await application.snapshot(validateContext(context))),
    })),
    ...extra,
  };
  if (application.execute)
    handlers.execute = unary(async ({ context, name, inputJson }: Operation) => {
      if (!isCommandName(name) || mutationOwners[name] !== service)
        throw new DomainError('VALIDATION', 'Неизвестная команда сервиса');
      const input = decode<Parameters<CommandClient['execute']>[1]>(inputJson);
      return {
        dataJson: encode(
          await (application as CommandClient).execute(
            name,
            input,
            validateContext(context),
          ),
        ),
      };
    });
  if (application.query)
    handlers.query = unary(async ({ context, name, inputJson }: Operation) => {
      if (!isQueryName(name) || queryOwners[name] !== service)
        throw new DomainError('VALIDATION', 'Неизвестный запрос сервиса');
      const input = parseQueryInput(name, decode(inputJson));
      return {
        dataJson: encode(
          await (application as QueryClient).query(name, input, validateContext(context)),
        ),
      };
    });
  if (application.statistics) {
    const statistics = application.statistics.bind(application);
    handlers.statistics = unary(
      async ({
        context,
        workspaceId,
      }: {
        context: RequestContext;
        workspaceId: string;
      }) => ({
        dataJson: encode(await statistics(uuid(workspaceId), validateContext(context))),
      }),
    );
  }
  return listen(service, handlers);
}
