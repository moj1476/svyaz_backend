import { required } from '../../config/src';
import { sqlServices } from '../../contracts/src';

export type SqlService = (typeof sqlServices)[number];

export function databaseSchema(): string {
  const schema = process.env.DB_SCHEMA ?? 'public';

  if (!/^[a-z][a-z0-9_]{0,62}$/.test(schema))
    throw new Error('Некорректное значение DB_SCHEMA');

  return schema;
}

export function databaseUrl(service: SqlService): string {
  const url = new URL('postgresql://localhost');

  url.hostname = required('DB_HOST');
  url.port = required('POSTGRES_PORT');
  url.username = `${service}_app`;
  url.password = required('SERVICE_DB_PASSWORD');
  url.pathname = `/${service}_db`;
  url.searchParams.set('schema', databaseSchema());

  return url.toString();
}
