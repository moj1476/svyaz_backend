import type { IdentityData } from '../../../../../packages/contracts/src';
import type { Prisma } from '../../../../../generated/identity/client';
import type { ReadScope } from '../../../../../packages/contracts/src/read-scope';
import { databaseFor } from '../../../../../packages/storage/src/prisma';
import {
  TransactionalRepository,
  type CommandSelection,
} from '../../../../../packages/storage/src/transactional-repository';
import type { RequestContext } from '../../../../../packages/contracts/src';
import { canonical, assertUpdated } from '../../../../../packages/storage/src/values';
import {
  fromUser,
  toUser,
  fromDevice,
  toDevice,
  fromSession,
  toSession,
} from './mapping';

interface StateSelection {
  users?: Prisma.UserWhereInput;
  devices?: Prisma.DeviceWhereInput;
  sessions?: Prisma.SessionWhereInput;
}

export class Repository extends TransactionalRepository<
  IdentityData,
  Prisma.TransactionClient
> {
  readonly db = databaseFor('identity');

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
  ): Promise<IdentityData> {
    return this.state(client, {
      users: { id: { in: [...(scope.userIds ?? [])] } },
      sessions: { userId: scope.actorId ?? '00000000-0000-0000-0000-000000000000' },
      devices: {
        sessions: {
          some: { userId: scope.actorId ?? '00000000-0000-0000-0000-000000000000' },
        },
      },
    });
  }

  private async state(
    client: Prisma.TransactionClient,
    selected: StateSelection,
  ): Promise<IdentityData> {
    const users = selected.users
      ? (await client.user.findMany({ where: selected.users })).map(fromUser)
      : [];

    const devices = selected.devices
      ? (await client.device.findMany({ where: selected.devices })).map(fromDevice)
      : [];

    const sessions = selected.sessions
      ? (await client.session.findMany({ where: selected.sessions })).map(fromSession)
      : [];

    return { users, devices, sessions };
  }

  protected async command(
    client: Prisma.TransactionClient,
    _operation: string,
    _input: Record<string, unknown>,
    context: RequestContext,
  ): Promise<CommandSelection<IdentityData>> {
    return {
      lock: 'identity:' + context.userId,
      load: () =>
        this.state(client, {
          users: { id: context.userId },
          sessions: { userId: context.userId },
        }),
    };
  }

  protected async save(
    client: Prisma.TransactionClient,
    before: IdentityData,
    after: IdentityData,
  ): Promise<void> {
    {
      const previous = new Map((before.users ?? []).map((row) => [row.id, row]));

      for (const row of after.users ?? []) {
        const prior = previous.get(row.id);

        if (prior && canonical(prior) === canonical(row)) continue;

        const data = toUser(row);

        if (!prior) await client.user.create({ data });
        else {
          const updated = await client.user.updateMany({
            where: { id: row.id, version: BigInt(prior.version) },
            data,
          });

          assertUpdated(updated.count);
        }
      }
    }
    {
      const previous = new Map((before.devices ?? []).map((row) => [row.id, row]));

      for (const row of after.devices ?? []) {
        const prior = previous.get(row.id);

        if (prior && canonical(prior) === canonical(row)) continue;

        const data = toDevice(row);

        if (!prior) await client.device.create({ data });
        else {
          const updated = await client.device.updateMany({ where: { id: row.id }, data });

          assertUpdated(updated.count);
        }
      }
    }
    {
      const previous = new Map((before.sessions ?? []).map((row) => [row.id, row]));

      for (const row of after.sessions ?? []) {
        const prior = previous.get(row.id);

        if (prior && canonical(prior) === canonical(row)) continue;

        const data = toSession(row);

        if (!prior) await client.session.create({ data });
        else {
          const updated = await client.session.updateMany({
            where: { id: row.id },
            data,
          });

          assertUpdated(updated.count);
        }
      }
    }

    for (const row of before.sessions ?? []) {
      if (!(after.sessions ?? []).some((item) => item.id === row.id))
        await client.session.deleteMany({ where: { id: row.id } });
    }

    for (const row of before.devices ?? []) {
      if (!(after.devices ?? []).some((item) => item.id === row.id))
        await client.device.deleteMany({ where: { id: row.id } });
    }

    for (const row of before.users ?? []) {
      if (!(after.users ?? []).some((item) => item.id === row.id))
        await client.user.deleteMany({ where: { id: row.id } });
    }
  }
}
