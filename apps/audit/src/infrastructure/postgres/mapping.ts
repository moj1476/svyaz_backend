import type { Prisma, AuditEvent as DbAuditEvent } from '#generated/audit/client';
import type { AuditData } from '#contracts';
import { jsonValue } from '#storage/values';

type AuditEvent = NonNullable<AuditData['events']>[number];

export function fromAuditEvent(row: DbAuditEvent): AuditEvent {
  return {
    ...row,
    occurredAt: row.occurredAt.toISOString(),
    metadata: row.metadata as AuditEvent['metadata'],
  };
}

export function toAuditEvent(row: AuditEvent): Prisma.AuditEventUncheckedCreateInput {
  return {
    ...row,
    occurredAt: new Date(row.occurredAt),
    metadata: jsonValue(row.metadata),
  };
}
