export { Repository } from './infrastructure/opensearch/repository';
export {
  ensureSearchIndex,
  openSearchClient,
  searchIndex,
} from './infrastructure/opensearch/client';
export type { SearchRepository } from './application/search-repository';
