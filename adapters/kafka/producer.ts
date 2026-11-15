import { Partitioners } from 'kafkajs';
import { Pool } from 'pg';
import { setTimeout as delay } from 'node:timers/promises';
import { databaseSchema, databaseUrl, type SqlService } from '#storage/connection';
import type { DomainEvent } from '#contracts/events';
import { ensureTopic, eventTopic, kafka } from './events';
import { retryWorker } from './worker';

type OutboxRow = Omit<DomainEvent, 'occurredAt'> & { occurredAt: Date };

export function startOutbox(service: SqlService) {
  const database = new Pool({
    connectionString: databaseUrl(service),
    options: '-c search_path=' + databaseSchema(),
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
    max: 1,
  });
  database.on('error', (error) =>
    console.error('Outbox PostgreSQL', service, error.name),
  );

  const kafkaClient = kafka(service);
  const stop = retryWorker('Outbox ' + service, async (signal) => {
    await ensureTopic(kafkaClient);
    const producer = kafkaClient.producer({
      allowAutoTopicCreation: false,
      createPartitioner: Partitioners.DefaultPartitioner,
    });
    try {
      await producer.connect();
      while (!signal.aborted) {
        const client = await database.connect();
        let count = 0;
        try {
          await client.query('BEGIN');
          const lock = await client.query<{ acquired: boolean }>(
            'SELECT pg_try_advisory_xact_lock(hashtext($1)) AS acquired',
            ['svyaz-kafka-outbox'],
          );
          if (lock.rows[0]?.acquired) {
            const pending = await client.query<OutboxRow>(`
              SELECT id, event_type AS type, schema_version AS "schemaVersion",
                aggregate_type AS "aggregateType", aggregate_id AS "aggregateId",
                workspace_id AS "workspaceId", actor_id AS "actorId",
                request_id AS "requestId", occurred_at AS "occurredAt", payload
              FROM outbox_events
              WHERE published_at IS NULL ORDER BY position LIMIT 50
            `);
            count = pending.rows.length;
            if (count) {
              await producer.send({
                topic: eventTopic,
                acks: -1,
                timeout: 5000,
                messages: pending.rows.map((event) => ({
                  key: service + ':' + event.aggregateId,
                  value: JSON.stringify(event),
                  headers: { source: service, eventId: event.id, eventType: event.type },
                })),
              });
              await client.query(
                'UPDATE outbox_events SET published_at = now() WHERE id = ANY($1::uuid[])',
                [pending.rows.map((event) => event.id)],
              );
            }
          }
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK').catch(() => undefined);
          throw error;
        } finally {
          client.release();
        }
        if (count < 50) await delay(500, undefined, { signal });
      }
    } finally {
      await producer.disconnect();
    }
  });

  return async () => {
    await stop();
    await database.end();
  };
}
