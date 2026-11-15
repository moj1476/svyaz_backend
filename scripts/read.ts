import { randomUUID } from 'node:crypto';
import { required } from '#config';
import { services, type ServiceName } from '#contracts';
import { DomainError, uuid } from '#contracts/errors';
import { createGrpcClients } from '#adapters/grpc/clients';

async function main() {
  const service = process.argv[2] as ServiceName;
  if (!services.includes(service))
    throw new Error(`Использование: pnpm read ${services.join('|')}`);
  const userId = uuid(required('LOCAL_USER_ID'));
  const requestId = randomUUID();
  const runtime = createGrpcClients();
  try {
    if (!(await runtime.clients.identity.userExists?.(userId)))
      throw new DomainError(
        'UNAUTHENTICATED',
        'Локальная учётная запись отсутствует или отключена',
      );
    const data = await runtime.clients[service].snapshot({ userId, requestId });
    console.log(JSON.stringify({ service, requestId, data }, null, 2));
  } finally {
    runtime.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
