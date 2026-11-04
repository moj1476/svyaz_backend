import type { FilesData } from '../../../../../packages/contracts/src';
import type { Prisma } from '../../../../../generated/files/client';
import type { ReadScope } from '../../../../../packages/contracts/src/read-scope';
import { databaseFor } from '../../../../../packages/storage/src/prisma';
import {
  TransactionalRepository,
  type CommandSelection,
} from '../../../../../packages/storage/src/transactional-repository';
import type { RequestContext } from '../../../../../packages/contracts/src';
import { canonical, assertUpdated } from '../../../../../packages/storage/src/values';
import { fromFile, toFile, fromAttachment, toAttachment } from './mapping';

interface StateSelection {
  files?: Prisma.FileWhereInput;
  attachments?: Prisma.AttachmentWhereInput;
}

export class Repository extends TransactionalRepository<
  FilesData,
  Prisma.TransactionClient
> {
  readonly db = databaseFor('files');

  protected transaction<R>(
    work: (client: Prisma.TransactionClient) => Promise<R>,
    repeatableRead = false,
  ): Promise<R> {
    return this.db.$transaction(work, {
      isolationLevel: repeatableRead ? 'RepeatableRead' : 'ReadCommitted',
    });
  }

  close() {
    return this.db.$disconnect();
  }

  protected async read(
    client: Prisma.TransactionClient,
    scope: ReadScope,
  ): Promise<FilesData> {
    return this.state(client, {
      files: {
        workspaceId: { in: [...(scope.workspaceIds ?? [])] },
        OR: [
          { id: { in: [...(scope.recordingFileIds ?? [])] } },
          { attachments: { some: { messageId: { in: [...(scope.messageIds ?? [])] } } } },
        ],
      },
      attachments: { messageId: { in: [...(scope.messageIds ?? [])] } },
    });
  }

  private async state(
    client: Prisma.TransactionClient,
    selected: StateSelection,
  ): Promise<FilesData> {
    const files = selected.files
      ? (await client.file.findMany({ where: selected.files })).map(fromFile)
      : [];

    const attachments = selected.attachments
      ? (await client.attachment.findMany({ where: selected.attachments })).map(
          fromAttachment,
        )
      : [];

    return { files, attachments };
  }

  protected async command(
    client: Prisma.TransactionClient,
    _operation: string,
    input: Record<string, unknown>,
    _context: RequestContext,
  ): Promise<CommandSelection<FilesData>> {
    const id = String(input.fileId);

    return {
      lock: 'file:' + id,
      load: () => this.state(client, { files: { id }, attachments: { fileId: id } }),
    };
  }

  protected async save(
    client: Prisma.TransactionClient,
    before: FilesData,
    after: FilesData,
  ): Promise<void> {
    {
      const previous = new Map((before.files ?? []).map((row) => [row.id, row]));

      for (const row of after.files ?? []) {
        const prior = previous.get(row.id);

        if (prior && canonical(prior) === canonical(row)) continue;

        const data = toFile(row);

        if (!prior) await client.file.create({ data });
        else {
          const updated = await client.file.updateMany({ where: { id: row.id }, data });

          assertUpdated(updated.count);
        }
      }
    }
    {
      const previous = new Map((before.attachments ?? []).map((row) => [row.id, row]));

      for (const row of after.attachments ?? []) {
        const prior = previous.get(row.id);

        if (prior && canonical(prior) === canonical(row)) continue;

        const data = toAttachment(row);

        if (!prior) await client.attachment.create({ data });
        else {
          const updated = await client.attachment.updateMany({
            where: { id: row.id },
            data,
          });

          assertUpdated(updated.count);
        }
      }
    }

    for (const row of before.attachments ?? []) {
      if (!(after.attachments ?? []).some((item) => item.id === row.id))
        await client.attachment.deleteMany({ where: { id: row.id } });
    }

    for (const row of before.files ?? []) {
      if (!(after.files ?? []).some((item) => item.id === row.id))
        await client.file.deleteMany({ where: { id: row.id } });
    }
  }

  async aggregate(workspaceId: string) {
    const result = await this.db.file.aggregate({
      where: { workspaceId: workspaceId, status: { not: 'DELETED' } },
      _sum: { sizeBytes: true },
    });

    return { storageUsed: (result._sum.sizeBytes ?? 0n).toString(), storageLimit: null };
  }
}
