import { required } from '../../../../../packages/config/src';
import type {
  ReadRepository,
  SearchData,
  SearchDocument,
} from '../../../../../packages/contracts/src';
import type { ReadScope } from '../../../../../packages/contracts/src/read-scope';

export class Repository implements ReadRepository<SearchData> {
  async load(scope?: ReadScope): Promise<SearchData> {
    const response = await fetch(
      `${required('OPENSEARCH_URL')}/svyaz_documents/_search`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          size: 1000,
          query: { terms: { workspaceId: scope?.workspaceIds ?? [] } },
        }),
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok)
      throw new Error(`Не удалось прочитать данные OpenSearch (${response.status})`);

    const result = (await response.json()) as {
      hits: { hits: { _source: SearchDocument }[] };
    };

    return { documents: result.hits.hits.map((h) => h._source) };
  }

  async close() {}
}
