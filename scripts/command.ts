import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { required } from '#config';
import type { ServiceName } from '#contracts';
import { createGrpcClients } from '#adapters/grpc/clients';
import { isCommandName, type CommandInput } from '#contracts/command-map';
import { mutationOwners, queryOwners } from '#contracts/commands';
import { DomainError } from '#contracts/errors';
import { parseQueryInput } from '#contracts/parse-input';
import { isQueryName } from '#contracts/queries';
import { executeClient, queryClient } from '#runtime/client-dispatch';
import { identifier } from '#runtime/validation';
async function main() {
  const [service, operation, path] = process.argv.slice(2);

  if (
    !service ||
    !operation ||
    !path ||
    ((!isCommandName(operation) || mutationOwners[operation] !== service) &&
      (!isQueryName(operation) || queryOwners[operation] !== service) &&
      !(
        operation === 'statistics' &&
        ['workspace', 'messaging', 'files', 'calls'].includes(service)
      ))
  )
    throw new DomainError(
      'VALIDATION',
      'Использование: pnpm command <сервис> <операция> <input.json>',
    );

  let input: unknown;

  try {
    input = JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
  } catch {
    throw new DomainError('VALIDATION', 'Не удалось прочитать корректный JSON-файл');
  }

  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new DomainError('VALIDATION', 'Ожидался объект JSON');

  const userId = identifier(required('LOCAL_USER_ID'));
  const runtime = createGrpcClients();
  const application = runtime.clients[service as ServiceName];

  try {
    if (!(await runtime.clients.identity.userExists?.(userId)))
      throw new DomainError(
        'UNAUTHENTICATED',
        'Локальная учётная запись отсутствует или отключена',
      );

    const context = { userId, requestId: randomUUID() };

    let result: unknown;

    if (isQueryName(operation) && queryOwners[operation] === service) {
      result = await queryClient(
        runtime.clients,
        operation,
        parseQueryInput(operation, input),
        context,
      );
    } else if (operation === 'statistics') {
      if (!application.statistics)
        throw new Error('Обработчик сводных данных отсутствует');

      result = await application.statistics(
        identifier((input as Record<string, unknown>).workspaceId),
        context,
      );
    } else {
      if (!isCommandName(operation)) throw new Error('Обработчик команды отсутствует');

      result = await executeClient(
        runtime.clients,
        operation,
        input as CommandInput<typeof operation>,
        context,
      );
    }

    console.log(JSON.stringify({ service, operation, result }, null, 2));
  } finally {
    runtime.close();
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      code: error instanceof DomainError ? error.code : 'UNAVAILABLE',
      message: error.message,
    }),
  );
  process.exitCode = 1;
});
