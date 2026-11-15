import { ensureSearchIndex, openSearchClient } from '#apps/search/src/repository';

export async function initializeSearch() {
  const client = openSearchClient();
  try {
    await ensureSearchIndex(client);
    console.log('Индекс OpenSearch готов');
  } finally {
    await client.close();
  }
}
