import { NestFactory } from '@nestjs/core';
import { localOnly, required } from '../../../packages/config/src';
import { AppModule } from './graphql.module';

export async function bootstrap() {
  localOnly();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.enableShutdownHooks();

  const port = Number(required('PORT'));

  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error('Некорректное значение PORT');

  await app.listen(port, '127.0.0.1');
  console.log(`Связь: локальный GraphQL API http://127.0.0.1:${port}/graphql`);
}
