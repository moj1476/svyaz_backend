import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '#contracts/events';
import type { ServiceDatabase } from '#storage/prisma';

export function createNotificationProjector(
  db: ServiceDatabase<'notifications'>,
  messageRecipients: (id: string) => Promise<string[]>,
  activeMembers: (id: string) => Promise<string[]>,
) {
  return async (event: DomainEvent, source: string) => {
    const workspaceId = event.workspaceId;
    if (source !== 'messaging' || event.type !== 'message.created.v1' || !workspaceId)
      return;
    const [recipients, members] = await Promise.all([
      messageRecipients(event.aggregateId),
      activeMembers(workspaceId),
    ]);
    const visible = new Set(members);
    const data = recipients
      .filter((id) => visible.has(id))
      .map((recipientId) => ({
        id: randomUUID(),
        workspaceId,
        recipientId,
        type: 'MESSAGE',
        targetType: 'MESSAGE',
        targetId: event.aggregateId,
        sourceEventId: event.id,
        preview: { conversationId: event.payload.conversationId ?? null },
        createdAt: new Date(event.occurredAt),
      }));
    if (data.length) await db.notification.createMany({ data, skipDuplicates: true });
  };
}
