import type {
  Prisma,
  File as DbFile,
  Attachment as DbAttachment,
} from '../../../../../generated/files/client';
import type { FilesData } from '../../../../../packages/contracts/src';

type File = NonNullable<FilesData['files']>[number];

type Attachment = NonNullable<FilesData['attachments']>[number];

export function fromFile(row: DbFile): File {
  return {
    ...row,
    sizeBytes: row.sizeBytes.toString(),
    status: row.status as File['status'],
  };
}

export function toFile(row: File): Prisma.FileUncheckedCreateInput {
  return { ...row, sizeBytes: BigInt(row.sizeBytes) };
}

export function fromAttachment(row: DbAttachment): Attachment {
  return { ...row };
}

export function toAttachment(row: Attachment): Prisma.AttachmentUncheckedCreateInput {
  return { ...row };
}
