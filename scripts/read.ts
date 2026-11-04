import { spawnSync } from 'node:child_process';
import { services, type ServiceName } from '../packages/contracts/src';

const service = process.argv[2] as ServiceName;

if (!services.includes(service)) {
  console.error(`Использование: pnpm read ${services.join('|')}`);
  process.exitCode = 1;
} else {
  const result = spawnSync(
    process.execPath,
    ['--env-file=.env', `dist/apps/${service}/src/main.js`],
    { stdio: 'inherit' },
  );

  process.exitCode = result.status ?? 1;
}
