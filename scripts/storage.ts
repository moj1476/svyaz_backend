import { services, sqlServices, type ServiceName } from '../packages/contracts/src';
import { prisma } from './prisma';
import { seedSql } from './seed/sql';
import { seedPresence } from './seed/presence';
import { seedSearch } from './seed/search';

async function main() {
  const operation = process.argv[2];

  if (operation !== 'migrate' && operation !== 'seed')
    throw new Error('Используйте migrate или seed');

  const selected = process.argv.slice(3).find((arg) => !arg.startsWith('--')) as
    ServiceName | undefined;

  const sqlOnly = process.argv.includes('--sql-only');

  if (selected && !services.includes(selected))
    throw new Error(`Неизвестный сервис: ${selected}`);

  if (operation === 'migrate' && selected && !sqlServices.some((s) => s === selected))
    throw new Error(`Для сервиса ${selected} нет SQL-миграций; используйте seed`);

  for (const service of sqlServices.filter((s) => !selected || s === selected)) {
    if (operation === 'migrate') prisma(service, ['migrate', 'deploy']);
    else await seedSql(service);
  }

  if (operation === 'seed' && !sqlOnly) {
    if (!selected || selected === 'presence') await seedPresence();

    if (!selected || selected === 'search') await seedSearch();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
