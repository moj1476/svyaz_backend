import { defineConfig, env } from 'prisma/config';
import { sqlServices } from './packages/contracts/src';

const service = process.env.PRISMA_SERVICE;
if (!sqlServices.some((name) => name === service))
  throw new Error('Укажите имя сервиса PostgreSQL в PRISMA_SERVICE');

export default defineConfig({
  schema: `apps/${service}/prisma/schema.prisma`,
  migrations: { path: `apps/${service}/prisma/migrations` },
  datasource: {
    url: env('DATABASE_URL'),
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
