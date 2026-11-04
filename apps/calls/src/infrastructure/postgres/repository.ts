import type { CallsData } from '../../../../../packages/contracts/src';
import type { Prisma } from '../../../../../generated/calls/client';
import type { ReadScope } from '../../../../../packages/contracts/src/read-scope';
import { databaseFor } from '../../../../../packages/storage/src/prisma';
import {
  TransactionalRepository,
  type CommandSelection,
} from '../../../../../packages/storage/src/transactional-repository';
import type { RequestContext } from '../../../../../packages/contracts/src';
import { canonical, assertUpdated } from '../../../../../packages/storage/src/values';
import {
  fromCall,
  toCall,
  fromCallParticipant,
  toCallParticipant,
  fromCallRecording,
  toCallRecording,
} from './mapping';

interface StateSelection {
  calls?: Prisma.CallWhereInput;
  participants?: Prisma.CallParticipantWhereInput;
  recordings?: Prisma.CallRecordingWhereInput;
}

export class Repository extends TransactionalRepository<
  CallsData,
  Prisma.TransactionClient
> {
  readonly db = databaseFor('calls');

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
  ): Promise<CallsData> {
    if (scope.recordingFileIds)
      return this.state(client, {
        recordings: { fileId: { in: [...scope.recordingFileIds] } },
      });

    const calls = { conversationId: { in: [...(scope.conversationIds ?? [])] } };

    return this.state(client, { calls, participants: { calls }, recordings: { calls } });
  }

  private async state(
    client: Prisma.TransactionClient,
    selected: StateSelection,
  ): Promise<CallsData> {
    const calls = selected.calls
      ? (await client.call.findMany({ where: selected.calls })).map(fromCall)
      : [];

    const participants = selected.participants
      ? (await client.callParticipant.findMany({ where: selected.participants })).map(
          fromCallParticipant,
        )
      : [];

    const recordings = selected.recordings
      ? (await client.callRecording.findMany({ where: selected.recordings })).map(
          fromCallRecording,
        )
      : [];

    return { calls, participants, recordings };
  }

  protected async command(
    client: Prisma.TransactionClient,
    operation: string,
    input: Record<string, unknown>,
    _context: RequestContext,
  ): Promise<CommandSelection<CallsData>> {
    const conversationId =
      operation === 'startCall'
        ? String(input.conversationId)
        : (
            await client.call.findUnique({
              where: { id: String(input.callId) },
              select: { conversationId: true },
            })
          )?.conversationId;

    return {
      lock: 'calls-conversation:' + String(conversationId ?? input.callId),
      load: () => {
        const calls = { conversationId: { in: conversationId ? [conversationId] : [] } };

        return this.state(client, { calls, participants: { calls } });
      },
    };
  }

  protected async save(
    client: Prisma.TransactionClient,
    before: CallsData,
    after: CallsData,
  ): Promise<void> {
    {
      const previous = new Map((before.calls ?? []).map((row) => [row.id, row]));

      for (const row of after.calls ?? []) {
        const prior = previous.get(row.id);

        if (prior && canonical(prior) === canonical(row)) continue;

        const data = toCall(row);

        if (!prior) await client.call.create({ data });
        else {
          const updated = await client.call.updateMany({ where: { id: row.id }, data });

          assertUpdated(updated.count);
        }
      }
    }
    {
      const previous = new Map((before.participants ?? []).map((row) => [row.id, row]));

      for (const row of after.participants ?? []) {
        const prior = previous.get(row.id);

        if (prior && canonical(prior) === canonical(row)) continue;

        const data = toCallParticipant(row);

        if (!prior) await client.callParticipant.create({ data });
        else {
          const updated = await client.callParticipant.updateMany({
            where: { id: row.id },
            data,
          });

          assertUpdated(updated.count);
        }
      }
    }
    {
      const previous = new Map((before.recordings ?? []).map((row) => [row.id, row]));

      for (const row of after.recordings ?? []) {
        const prior = previous.get(row.id);

        if (prior && canonical(prior) === canonical(row)) continue;

        const data = toCallRecording(row);

        if (!prior) await client.callRecording.create({ data });
        else {
          const updated = await client.callRecording.updateMany({
            where: { id: row.id },
            data,
          });

          assertUpdated(updated.count);
        }
      }
    }

    for (const row of before.recordings ?? []) {
      if (!(after.recordings ?? []).some((item) => item.id === row.id))
        await client.callRecording.deleteMany({ where: { id: row.id } });
    }

    for (const row of before.participants ?? []) {
      if (!(after.participants ?? []).some((item) => item.id === row.id))
        await client.callParticipant.deleteMany({ where: { id: row.id } });
    }

    for (const row of before.calls ?? []) {
      if (!(after.calls ?? []).some((item) => item.id === row.id))
        await client.call.deleteMany({ where: { id: row.id } });
    }
  }

  async aggregate(workspaceId: string) {
    const now = new Date();
    const count = await this.db.call.count({
      where: {
        workspaceId: workspaceId,
        startedAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), lte: now },
      },
    });

    return { callsLast30Days: String(count) };
  }
}
