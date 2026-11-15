import { Kafka } from 'kafkajs';
import { z } from 'zod';
import type { DomainEvent } from '#contracts/events';

export const eventTopic = 'svyaz.domain-events.v1';

export function kafka(clientId: string) {
  return new Kafka({
    clientId: 'svyaz-' + clientId,
    brokers: (process.env.KAFKA_BROKERS ?? '127.0.0.1:59092')
      .split(',')
      .map((broker) => broker.trim()),
    requestTimeout: 5000,
    retry: { retries: 3 },
  });
}

export async function ensureTopic(client: Kafka) {
  const admin = client.admin();
  try {
    await admin.connect();
    if ((await admin.listTopics()).includes(eventTopic)) return;
    await admin.createTopics({
      timeout: 5000,
      topics: [{ topic: eventTopic, numPartitions: 3, replicationFactor: 1 }],
    });
  } finally {
    await admin.disconnect();
  }
}

const schema = z.object({
  id: z.uuid(),
  type: z.string().endsWith('.v1'),
  schemaVersion: z.literal(1),
  aggregateType: z.string().min(1),
  aggregateId: z.uuid(),
  workspaceId: z.uuid().nullable(),
  occurredAt: z.iso.datetime(),
  actorId: z.uuid(),
  requestId: z.uuid(),
  payload: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});

export function readEvent(value: Buffer | null): DomainEvent | undefined {
  if (!value) return;
  try {
    const result = schema.safeParse(JSON.parse(value.toString('utf8')));
    if (result.success) return result.data;
  } catch {
    return;
  }
}
