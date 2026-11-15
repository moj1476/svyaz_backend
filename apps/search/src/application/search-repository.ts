import type { SearchDocument } from '#contracts';

export interface SearchSelection {
  workspaceIds: readonly string[];
  text?: string;
  types?: readonly string[];
  conversationIds?: readonly string[];
  from?: string;
  to?: string;
  field: 'ID' | 'TITLE';
  direction: 'ASC' | 'DESC';
  after?: { key: string; id: string };
  limit: number;
}

export interface SearchRepository {
  find(selection: SearchSelection): Promise<SearchDocument[]>;
  close(): Promise<void>;
}
