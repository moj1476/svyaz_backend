import { databaseFor } from '../../packages/storage/src/prisma';
import { labData } from '../../packages/lab-data/src';

import { toAuditEvent } from '../../apps/audit/src/infrastructure/postgres/mapping';
export async function seedAudit(): Promise<void> {
  const db = databaseFor('audit');
  try {
    await db.$transaction(async (client) => {
      await client.auditEvent.createMany({
        data: (labData.audit.events ?? []).map(toAuditEvent),
        skipDuplicates: true,
      });
    });
  } finally {
    await db.$disconnect();
  }
}
