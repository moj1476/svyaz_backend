import { databaseFor } from '../../packages/storage/src/prisma';
import { labData } from '../../packages/lab-data/src';
import {
  toUser,
  toDevice,
  toSession,
} from '../../apps/identity/src/infrastructure/postgres/mapping';

export async function seedIdentity(): Promise<void> {
  const db = databaseFor('identity');
  try {
    await db.$transaction(async (client) => {
      await client.user.createMany({
        data: (labData.identity.users ?? []).map(toUser),
        skipDuplicates: true,
      });
      await client.device.createMany({
        data: (labData.identity.devices ?? []).map(toDevice),
        skipDuplicates: true,
      });
      await client.session.createMany({
        data: (labData.identity.sessions ?? []).map(toSession),
        skipDuplicates: true,
      });
    });
  } finally {
    await db.$disconnect();
  }
}
