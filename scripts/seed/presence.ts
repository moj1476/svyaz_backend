import { createClient } from 'redis';
import { required } from '../../packages/config/src';
import { labData } from '../../packages/lab-data/src';
export async function seedPresence() {
  const redis = createClient({
    url: required('REDIS_URL'),
    socket: { reconnectStrategy: false },
  });

  redis.on('error', () => {});

  try {
    await redis.connect();

    for (const p of labData.presence.presence)
      await redis.set(
        `presence:${p.workspaceId}:${p.userId}`,
        JSON.stringify({ ...p, lastHeartbeat: new Date().toISOString() }),
        { EX: 90 },
      );
  } finally {
    if (redis.isOpen) await redis.quit();
  }

  console.log('presence: seeded');
}
