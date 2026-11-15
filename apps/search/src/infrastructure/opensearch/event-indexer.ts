import type { DomainEvent } from '#contracts/events';
import type { SearchDocument } from '#contracts';
import { ensureSearchIndex, openSearchClient, searchIndex } from './client';

const indexedEvents = new Set([
  'message.created.v1',
  'message.updated.v1',
  'message.deleted.v1',
  'conversation.created.v1',
  'conversation.updated.v1',
  'conversation.archived.v1',
]);

export function createIndexer(
  load: (type: string, id: string, occurredAt: string) => Promise<SearchDocument | null>,
) {
  const client = openSearchClient();
  let ready = false;
  return {
    async handle(event: DomainEvent, source: string) {
      if (source !== 'messaging' || !indexedEvents.has(event.type)) return;
      if (!ready) {
        await ensureSearchIndex(client);
        ready = true;
      }
      try {
        const document = await load(
          event.aggregateType,
          event.aggregateId,
          event.occurredAt,
        );
        if (document) {
          await client.index({
            index: searchIndex,
            id: document.id,
            body: {
              ...document,
              searchText: (document.title + ' ' + (document.snippet ?? '')).toLowerCase(),
            },
            refresh: 'wait_for',
          });
        } else {
          await client.delete(
            { index: searchIndex, id: event.aggregateId, refresh: 'wait_for' },
            { ignore: [404] },
          );
        }
      } catch (error) {
        ready = false;
        throw error;
      }
    },
    close: () => client.close(),
  };
}
