import { spawn, type ChildProcess } from 'node:child_process';
import { services, type ServiceName } from '#contracts';

const children = new Set<ChildProcess>();
const ready = new Set<ServiceName>();
const dev = process.argv.includes('--dev');
let stopping = false;
let gatewayStarted = false;

function stop(code: number) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    if (child.connected) child.disconnect();
    else child.kill();
  }
  const deadline = setTimeout(() => {
    for (const child of children) child.kill();
  }, 15000);
  deadline.unref();
}

function start(name: ServiceName | 'graphql-api', args: string[] = []) {
  const entry = dev ? `apps/${name}/src/main.ts` : `dist/apps/${name}/src/main.js`;
  const child = spawn(
    process.execPath,
    ['--env-file=.env', ...(dev ? ['--import', 'tsx'] : []), entry, ...args],
    { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] },
  );
  children.add(child);
  child.once('error', (error) => {
    console.error(`Не удалось запустить ${name}`, error.message);
    stop(1);
  });
  child.once('exit', (code, signal) => {
    children.delete(child);
    if (stopping) return;
    console.error(`Процесс ${name} завершился: ${code ?? signal}`);
    if (!gatewayStarted || name === 'graphql-api') return stop(1);
    ready.delete(name);
    setTimeout(() => {
      if (!stopping) startService(name);
    }, 1500);
  });
  return child;
}

function startService(name: ServiceName) {
  start(name).on('message', (message) => {
    if (message !== 'ready' || stopping) return;
    ready.add(name);
    if (gatewayStarted || ready.size !== services.length) return;
    gatewayStarted = true;
    start(
      'graphql-api',
      process.argv.slice(2).filter((arg) => arg !== '--dev'),
    );
  });
}

process.once('SIGINT', () => stop(0));
process.once('SIGTERM', () => stop(0));
services.forEach(startService);
