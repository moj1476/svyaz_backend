import type { SearchDocument } from '#contracts';
import type { ServiceDatabase } from '#storage/prisma';

export async function searchProjection(
  tx: ServiceDatabase<'messaging'>,
  type: string,
  id: string,
  occurredAt: Date,
): Promise<SearchDocument | null> {
  if (type === 'message') {
    const row = await tx.message.findUnique({
      where: { id },
      include: { conversations: { select: { workspaceId: true } } },
    });
    if (!row || row.status === 'DELETED' || row.body == null) return null;
    return {
      id,
      sourceId: id,
      sourceType: 'MESSAGE',
      workspaceId: row.conversations.workspaceId,
      conversationId: row.conversationId,
      title: row.body.slice(0, 200),
      snippet: row.body,
      sourceVersion: row.version.toString(),
      occurredAt: row.sentAt.toISOString(),
    };
  }
  const row = await tx.conversation.findUnique({ where: { id } });
  if (!row || row.type !== 'CHANNEL' || !row.title) return null;
  return {
    id,
    sourceId: id,
    sourceType: 'CHANNEL',
    workspaceId: row.workspaceId,
    conversationId: id,
    title: row.title,
    snippet: null,
    sourceVersion: row.version.toString(),
    occurredAt: occurredAt.toISOString(),
  };
}
