import { databaseFor } from '../../packages/storage/src/prisma';
import { labData } from '../../packages/lab-data/src';

import { toNotification } from '../../apps/notifications/src/infrastructure/postgres/mapping';

export async function seedNotifications(): Promise<void> {
  const db = databaseFor('notifications');
  try {
    await db.$transaction(async (client) => {
      await client.notification.createMany({
        data: (labData.notifications.notifications ?? []).map(toNotification),
        skipDuplicates: true,
      });
    });
  } finally {
    await db.$disconnect();
  }
}
