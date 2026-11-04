export interface SearchDocument {
  occurredAt?: string;
  id: string;
  sourceId: string;
  sourceType: string;
  workspaceId: string;
  conversationId: string | null;
  title: string;
  snippet: string | null;
  sourceVersion: string;
}

export interface SearchData {
  documents: SearchDocument[];
}
