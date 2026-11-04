import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient as IdentityClient } from '../../../generated/identity/client';
import { PrismaClient as WorkspaceClient } from '../../../generated/workspace/client';
import { PrismaClient as MessagingClient } from '../../../generated/messaging/client';
import { PrismaClient as FilesClient } from '../../../generated/files/client';
import { PrismaClient as NotificationsClient } from '../../../generated/notifications/client';
import { PrismaClient as CallsClient } from '../../../generated/calls/client';
import { PrismaClient as AuditClient } from '../../../generated/audit/client';
import { databaseSchema, databaseUrl, type SqlService } from './connection';

const transactionOptions = { maxWait: 5000, timeout: 15000 };

const clients = {
  identity: (adapter: PrismaPg) => new IdentityClient({ adapter, transactionOptions }),
  workspace: (adapter: PrismaPg) => new WorkspaceClient({ adapter, transactionOptions }),
  messaging: (adapter: PrismaPg) => new MessagingClient({ adapter, transactionOptions }),
  files: (adapter: PrismaPg) => new FilesClient({ adapter, transactionOptions }),
  notifications: (adapter: PrismaPg) =>
    new NotificationsClient({ adapter, transactionOptions }),
  calls: (adapter: PrismaPg) => new CallsClient({ adapter, transactionOptions }),
  audit: (adapter: PrismaPg) => new AuditClient({ adapter, transactionOptions }),
};

export type ServiceDatabase<S extends SqlService> = ReturnType<(typeof clients)[S]>;

export interface Database {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
  $disconnect(): Promise<void>;
}

export function databaseFor<S extends SqlService>(service: S): ServiceDatabase<S> {
  const schema = databaseSchema();
  const adapter = new PrismaPg(
    {
      connectionString: databaseUrl(service),
      max: 4,
      connectionTimeoutMillis: 5000,
      statement_timeout: 10000,
      idle_in_transaction_session_timeout: 10000,
      options: `-c search_path=${schema}`,
    },
    { schema },
  );

  return clients[service](adapter) as ServiceDatabase<S>;
}

export type Session = Pick<Database, '$queryRawUnsafe' | '$executeRawUnsafe'>;

export interface SqlExecutor {
  query<T extends object = Record<string, unknown>>(
    sql: string,
    values?: readonly unknown[],
  ): Promise<{ rows: T[]; rowCount: number }>;
}

export function sqlExecutor(client: Session): SqlExecutor {
  return {
    async query<T extends object>(sql: string, values: readonly unknown[] = []) {
      const rows = await client.$queryRawUnsafe<T[]>(
        sql,
        ...values.map((value) => value ?? null),
      );

      return { rows, rowCount: rows.length };
    },
  };
}

export function wireValue(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();

  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) return value.map(wireValue);

  if (value !== null && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, wireValue(item)]),
    );

  return value;
}
