import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import 'reflect-metadata';
import { ReadService as Audit } from '../apps/audit/src/application';
import { Repository as AuditRepository } from '../apps/audit/src/repository';
import { BusinessService as Calls } from '../apps/calls/src/operations';
import { Repository as CallsRepository } from '../apps/calls/src/repository';
import { BusinessService as Files } from '../apps/files/src/operations';
import { Repository as FilesRepository } from '../apps/files/src/repository';
import { BusinessService as Identity } from '../apps/identity/src/operations';
import { Repository as IdentityRepository } from '../apps/identity/src/repository';
import { BusinessService as Messaging } from '../apps/messaging/src/operations';
import { Repository as MessagingRepository } from '../apps/messaging/src/repository';
import { BusinessService as Notifications } from '../apps/notifications/src/operations';
import { Repository as NotificationsRepository } from '../apps/notifications/src/repository';
import { ReadService as Search } from '../apps/search/src/application';
import { Repository as SearchRepository } from '../apps/search/src/repository';
import { BusinessService as Workspace } from '../apps/workspace/src/operations';
import { Repository as WorkspaceRepository } from '../apps/workspace/src/repository';
import { localOnly } from '../packages/config/src';
import type { DataMap, ServiceClient, ServiceName } from '../packages/contracts/src';
import type { AccessClient } from '../packages/contracts/src/access';
import { isCommandName } from '../packages/contracts/src/command-map';
import type { TransactionStore } from '../packages/contracts/src/commands';
import { mutationOwners, queryOwners } from '../packages/contracts/src/commands';
import { DomainError } from '../packages/contracts/src/errors';
import {
  parseCommandInput,
  parseQueryInput,
} from '../packages/contracts/src/parse-input';
import { isQueryName } from '../packages/contracts/src/queries';
import { ids } from '../packages/lab-data/src';
import { identifier } from '../packages/runtime/src/validation';
import { MockAccessClient } from '../adapters/mocks/mock-access';

function host<K extends ServiceName>(
  Repository: new () => TransactionStore<DataMap[K]>,
  Application: new (
    store: TransactionStore<DataMap[K]>,
    access: AccessClient,
  ) => ServiceClient<K>,
) {
  const repository = new Repository();

  return {
    repository,
    application: new Application(repository, new MockAccessClient()),
  };
}

async function main() {
  localOnly();

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

  const hosts = {
    identity: () => host<'identity'>(IdentityRepository, Identity),
    workspace: () => host<'workspace'>(WorkspaceRepository, Workspace),
    messaging: () => host<'messaging'>(MessagingRepository, Messaging),
    files: () => host<'files'>(FilesRepository, Files),
    notifications: () => host<'notifications'>(NotificationsRepository, Notifications),
    calls: () => host<'calls'>(CallsRepository, Calls),
    search: () => {
      const repository = new SearchRepository();

      return {
        repository,
        application: new Search(repository, new MockAccessClient()),
      };
    },
    audit: () => {
      const repository = new AuditRepository();

      return {
        repository,
        application: new Audit(repository, new MockAccessClient()),
      };
    },
  };

  const { repository, application: instance } = hosts[service as keyof typeof hosts]();
  const application: ServiceClient<ServiceName> = instance;

  @Module({ providers: [{ provide: 'BUSINESS', useValue: application }] })
  class CommandModule {}

  const app = await NestFactory.createApplicationContext(CommandModule, {
    logger: false,
  });

  try {
    const context = {
      userId: identifier(process.env.LAB_USER_ID ?? ids.alice),
      requestId: randomUUID(),
    };

    let result: unknown;

    if (isQueryName(operation) && queryOwners[operation] === service) {
      if (!application.query) throw new Error('Обработчик запроса отсутствует');

      result = await application.query(
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
      if (!isCommandName(operation) || !application.execute)
        throw new Error('Обработчик команды отсутствует');

      result = await application.execute(
        operation,
        parseCommandInput(operation, input),
        context,
      );
    }

    console.log(JSON.stringify({ service, operation, result }, null, 2));
  } finally {
    await repository.close();
    await app.close();
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
