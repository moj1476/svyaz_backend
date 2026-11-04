import 'reflect-metadata';
import { bootstrap } from './bootstrap';

void bootstrap().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Не удалось запустить сервер');
  process.exitCode = 1;
});
