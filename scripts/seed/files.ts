import { databaseFor } from '../../packages/storage/src/prisma';
import { labData } from '../../packages/lab-data/src';

import {
  toFile,
  toAttachment,
} from '../../apps/files/src/infrastructure/postgres/mapping';

export async function seedFiles(): Promise<void> {
  const db = databaseFor('files');
  try {
    await db.$transaction(async (client) => {
      await client.file.createMany({
        data: (labData.files.files ?? []).map(toFile),
        skipDuplicates: true,
      });
      await client.attachment.createMany({
        data: (labData.files.attachments ?? []).map(toAttachment),
        skipDuplicates: true,
      });
    });
  } finally {
    await db.$disconnect();
  }
}
