export function required(name: string): string {
  const value = process.env[name];

  if (!value) throw new Error(`Не задан параметр конфигурации: ${name}`);

  return value;
}

export function localOnly() {
  if (process.env.NODE_ENV !== 'development' || process.env.LAB_DEV_AUTH !== 'true')
    throw new Error(
      'Локальный mock API разрешён только с NODE_ENV=development и LAB_DEV_AUTH=true',
    );
}

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function backendRoot() {
  let directory = __dirname;

  while (!existsSync(join(directory, 'contracts/graphql/svyaz-read.graphql'))) {
    const parent = dirname(directory);

    if (parent === directory) throw new Error('Контракты серверной части не найдены');

    directory = parent;
  }

  return directory;
}
