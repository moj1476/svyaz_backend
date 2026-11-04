import { required } from '../../packages/config/src';
import { labData } from '../../packages/lab-data/src';
export async function seedSearch() {
  const url = required('OPENSEARCH_URL');
  const exists = await fetch(`${url}/svyaz_documents`, {
    method: 'HEAD',
    signal: AbortSignal.timeout(5000),
  });

  if (exists.status === 404) {
    const mapping = {
      mappings: {
        properties: {
          id: { type: 'keyword' },
          sourceId: { type: 'keyword' },
          sourceType: { type: 'keyword' },
          workspaceId: { type: 'keyword' },
          conversationId: { type: 'keyword' },
          title: { type: 'text' },
          snippet: { type: 'text' },
          sourceVersion: { type: 'keyword' },
        },
      },
    };

    const result = await fetch(`${url}/svyaz_documents`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping),
    });

    if (!result.ok) throw new Error('Не удалось создать индекс OpenSearch');
  } else if (!exists.ok) throw new Error('OpenSearch недоступен');

  for (const d of labData.search.documents) {
    const response = await fetch(`${url}/svyaz_documents/_create/${d.id}?refresh=true`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    });

    if (!response.ok && response.status !== 409)
      throw new Error('Не удалось заполнить OpenSearch');

    if (response.status === 409 && d.occurredAt) {
      const update = await fetch(`${url}/svyaz_documents/_update/${d.id}?refresh=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: {
            source:
              'if (ctx._source.occurredAt == null) { ctx._source.occurredAt = params.at } else { ctx.op = "noop" }',
            params: { at: d.occurredAt },
          },
        }),
      });

      if (!update.ok) throw new Error('Не удалось дополнить метаданные OpenSearch');
    }
  }

  console.log('search: seeded');
}
