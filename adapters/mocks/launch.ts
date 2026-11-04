import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import { localOnly } from '../../packages/config/src';
import type {
  DataMap,
  ReadRepository,
  RequestContext,
  ServiceClient,
  ServiceName,
} from '../../packages/contracts/src';
import type { AccessClient } from '../../packages/contracts/src/access';
import { uuid } from '../../packages/contracts/src/errors';
import { ids } from '../../packages/lab-data/src';
import { MockAccessClient } from './mock-access';

export async function launch<K extends ServiceName>(
  name: K,
  Application: new (
    repository: ReadRepository<DataMap[K]>,
    access: AccessClient,
  ) => ServiceClient<K>,
  Repository: new () => ReadRepository<DataMap[K]>,
) {
  localOnly();

  const repository = new Repository();
  const context: RequestContext = {
    userId: uuid(process.env.LAB_USER_ID ?? ids.alice),
    requestId: randomUUID(),
  };

  @Module({
    providers: [
      {
        provide: 'READ',
        useFactory: () => new Application(repository, new MockAccessClient()),
      },
    ],
  })
  class ServiceModule {}

  const app = await NestFactory.createApplicationContext(ServiceModule, {
    logger: false,
  });

  try {
    const read = app.get<ServiceClient<K>>('READ');

    console.log(
      JSON.stringify(
        {
          service: name,
          requestId: context.requestId,
          data: await read.snapshot(context),
        },
        null,
        2,
      ),
    );
  } finally {
    await repository.close();
    await app.close();
  }
}
