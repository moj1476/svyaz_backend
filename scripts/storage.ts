import { services, sqlServices, type ServiceName } from '#contracts';
import { prisma } from './prisma';
import { initializeIdentity, initializePermissions } from './initialize-sql';
import { initializeSearch } from './initialize-search';

async function main() {
  const [operation, ...args] = process.argv.slice(2);
  const selected = args.find((arg) => !arg.startsWith('--')) as ServiceName | undefined;
  if (selected && !services.includes(selected))
    throw new Error(`Неизвестный сервис: ${selected}`);

  if (operation === 'migrate') {
    if (selected && !sqlServices.some((service) => service === selected))
      throw new Error(`Для сервиса ${selected} нет SQL-миграций`);

    for (const service of sqlServices.filter(
      (service) => !selected || service === selected,
    ))
      prisma(service, ['migrate', 'deploy']);
    return;
  }

  if (operation !== 'seed') throw new Error('Используйте migrate или seed');

  if (!selected || selected === 'identity') await initializeIdentity();
  if (!selected || selected === 'workspace') await initializePermissions();
  if (!args.includes('--sql-only') && (!selected || selected === 'search'))
    await initializeSearch();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
