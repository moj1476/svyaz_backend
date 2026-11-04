import type { FileStatus } from '../inputs';

export interface FileRecord {
  id: string;
  workspaceId: string;
  ownerId: string;
  name: string;
  mimeType: string;
  sizeBytes: string;
  status: FileStatus;
  objectKey: string;
}

export interface Attachment {
  id: string;
  messageId: string;
  fileId: string;
}

export interface FilesData {
  files: FileRecord[];
  attachments: Attachment[];
}
