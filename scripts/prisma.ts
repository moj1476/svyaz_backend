import { spawnSync } from 'node:child_process';
import { backendRoot } from '../packages/config/src';
import { sqlServices } from '../packages/contracts/src';
import { databaseUrl, type SqlService } from '../packages/storage/src/connection';

export function prisma(service: SqlService, args: string[], offline = false): void {
  const result = spawnSync(
    process.execPath,
    [require.resolve('prisma/build/index.js'), ...args],
    {
      cwd: backendRoot(),
      env: {
        ...process.env,
        PRISMA_SERVICE: service,
        DATABASE_URL: offline
          ? 'postgresql://unused:unused@localhost/unused'
          : databaseUrl(service),
      },
      stdio: 'inherit',
    },
  );

  if (result.error) throw result.error;

  if (result.status !== 0)
    throw new Error(`Не удалось выполнить Prisma ${args[0]} для сервиса ${service}`);
}

if (require.main === module) {
  try {
    const [operation, selected, ...args] = process.argv.slice(2);

    if (
      !['generate', 'validate', 'format', 'studio', 'dev', 'status'].includes(
        operation ?? '',
      )
    )
      throw new Error(
        'Используйте generate|validate|format [сервис] или studio|dev|status <сервис>',
      );

    if (selected && !sqlServices.some((name) => name === selected))
      throw new Error('Неизвестный SQL-сервис');

    if (['studio', 'dev', 'status'].includes(operation!) && !selected)
      throw new Error('Выберите один сервис');

    for (const service of sqlServices.filter((name) => !selected || name === selected)) {
      const command =
        operation === 'dev' || operation === 'status'
          ? ['migrate', operation]
          : [operation!];

      prisma(
        service,
        [...command, ...args],
        ['generate', 'validate', 'format'].includes(operation!),
      );
    }
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : 'Не удалось выполнить команду Prisma',
    );
    process.exitCode = 1;
  }
}
