import type { DomainEvent } from '#contracts/events';
import type { ServiceDatabase } from '#storage/prisma';

export async function recordEvent(
  db: ServiceDatabase<'audit'>,
  event: DomainEvent,
  source: string,
) {
  if (!event.workspaceId) return;
  await db.auditEvent.createMany({
    skipDuplicates: true,
    data: [
      {
        id: event.id,
        workspaceId: event.workspaceId,
        actorId: event.actorId,
        action: event.type,
        targetType: event.aggregateType,
        targetId: event.aggregateId,
        outcome: 'SUCCESS',
        occurredAt: new Date(event.occurredAt),
        metadata: {
          source,
          requestId: event.requestId,
          schemaVersion: event.schemaVersion,
        },
      },
    ],
  });
}
