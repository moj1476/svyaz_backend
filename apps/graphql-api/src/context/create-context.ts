import { GraphQLError } from 'graphql';
import { randomUUID } from 'node:crypto';
import { services, type ServiceName } from '../../../../packages/contracts/src';
import { DomainError } from '../../../../packages/contracts/src/errors';
import { labData } from '../../../../packages/lab-data/src';
import type { QueryContext } from './query-context';
import type { RequestData } from './request-data';
export function createContext(
  headers: Record<string, string | undefined>,
  data: RequestData,
): QueryContext {
  const login = headers['x-lab-user'] ?? 'alice';
  const user = labData.identity.users.find((u) => u.login === login);

  if (!user)
    throw new GraphQLError('Неизвестный учебный пользователь', {
      extensions: { code: 'UNAUTHENTICATED' },
    });

  const cache = new Map<ServiceName, Promise<unknown>>();
  const failed = headers['x-lab-fail'];

  if (failed) {
    if (!services.includes(failed as ServiceName))
      throw new GraphQLError('Неизвестный источник сбоя');

    const rejected = Promise.reject(
      new DomainError('UNAVAILABLE', 'Учебный отказ источника'),
    );

    rejected.catch(() => {});
    cache.set(failed as ServiceName, rejected);
  }

  const context: QueryContext = {
    userId: user.id,
    requestId: randomUUID(),
    cache,
    failed: failed as ServiceName | undefined,
  };

  data.prepareContext(context);

  return context;
}
