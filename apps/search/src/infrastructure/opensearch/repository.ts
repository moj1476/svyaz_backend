import type { SearchDocument } from '#contracts';
import type {
  SearchRepository,
  SearchSelection,
} from '../../application/search-repository';
import { openSearchClient, searchIndex } from './client';

export class Repository implements SearchRepository {
  private readonly client = openSearchClient();

  async find(selection: SearchSelection): Promise<SearchDocument[]> {
    const {
      workspaceIds,
      text,
      types,
      conversationIds,
      from,
      to,
      field,
      direction,
      after,
      limit,
    } = selection;
    if (!workspaceIds.length || types?.length === 0 || conversationIds?.length === 0)
      return [];

    const filter = [
      { terms: { workspaceId: [...workspaceIds] } },
      ...(types ? [{ terms: { sourceType: [...types] } }] : []),
      ...(conversationIds ? [{ terms: { conversationId: [...conversationIds] } }] : []),
      ...(from || to ? [{ range: { occurredAt: { gte: from, lte: to } } }] : []),
    ];
    const order = direction === 'ASC' ? 'asc' : 'desc';
    const pattern = text
      ?.toLowerCase()
      .replace(/[\\*?]/g, (character) => '\\' + character);
    const result = await this.client.search({
      index: searchIndex,
      body: {
        size: limit,
        query: {
          bool: {
            filter,
            must: pattern
              ? [{ wildcard: { searchText: { value: '*' + pattern + '*' } } }]
              : [],
          },
        },
        sort:
          field === 'TITLE' ? [{ 'title.raw': order }, { id: order }] : [{ id: order }],
        search_after: after
          ? field === 'TITLE'
            ? [after.key, after.id]
            : [after.id]
          : undefined,
      },
    });
    return result.body.hits.hits.map((hit) => hit._source as SearchDocument);
  }

  async close() {
    await this.client.close();
  }
}
