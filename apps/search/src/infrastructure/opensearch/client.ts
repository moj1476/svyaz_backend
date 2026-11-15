import { Client } from '@opensearch-project/opensearch';
import { required } from '#config';

export const searchIndex = 'svyaz_documents';

export function openSearchClient() {
  return new Client({
    node: required('OPENSEARCH_URL'),
    requestTimeout: 5000,
    maxRetries: 1,
  });
}

export async function ensureSearchIndex(client: Client) {
  const properties = {
    id: { type: 'keyword' as const },
    sourceId: { type: 'keyword' as const },
    sourceType: { type: 'keyword' as const },
    workspaceId: { type: 'keyword' as const },
    conversationId: { type: 'keyword' as const },
    title: { type: 'text' as const, fields: { raw: { type: 'keyword' as const } } },
    snippet: { type: 'text' as const },
    searchText: { type: 'wildcard' as const },
    sourceVersion: { type: 'keyword' as const },
    occurredAt: { type: 'date' as const },
  };

  if (!(await client.indices.exists({ index: searchIndex })).body) {
    try {
      await client.indices.create({
        index: searchIndex,
        body: { mappings: { properties } },
      });
      return;
    } catch (error) {
      if (
        (error as { body?: { error?: { type?: string } } }).body?.error?.type !==
        'resource_already_exists_exception'
      )
        throw error;
    }
  }
  await client.indices.putMapping({ index: searchIndex, body: { properties } });
  const missing = { bool: { must_not: [{ exists: { field: 'searchText' } }] } };
  if ((await client.count({ index: searchIndex, body: { query: missing } })).body.count) {
    await client.updateByQuery(
      {
        index: searchIndex,
        conflicts: 'proceed',
        refresh: true,
        body: {
          query: missing,
          script: {
            lang: 'painless',
            source:
              "ctx._source.searchText = (ctx._source.title + ' ' + (ctx._source.snippet == null ? '' : ctx._source.snippet)).toLowerCase()",
          },
        },
      },
      { requestTimeout: 60000 },
    );
  }
}
