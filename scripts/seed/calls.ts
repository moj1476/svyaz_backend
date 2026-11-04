import { databaseFor } from '../../packages/storage/src/prisma';
import { labData } from '../../packages/lab-data/src';

import {
  toCall,
  toCallParticipant,
  toCallRecording,
} from '../../apps/calls/src/infrastructure/postgres/mapping';

export async function seedCalls(): Promise<void> {
  const db = databaseFor('calls');
  try {
    await db.$transaction(async (client) => {
      await client.call.createMany({
        data: (labData.calls.calls ?? []).map(toCall),
        skipDuplicates: true,
      });
      await client.callParticipant.createMany({
        data: (labData.calls.participants ?? []).map(toCallParticipant),
        skipDuplicates: true,
      });
      await client.callRecording.createMany({
        data: (labData.calls.recordings ?? []).map(toCallRecording),
        skipDuplicates: true,
      });
    });
  } finally {
    await db.$disconnect();
  }
}
