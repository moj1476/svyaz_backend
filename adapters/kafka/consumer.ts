import { once } from 'node:events';
import { KafkaJSError } from 'kafkajs';
import type { DomainEvent } from '#contracts/events';
import { ensureTopic, eventTopic, kafka, readEvent } from './events';
import { retryWorker } from './worker';

export function startConsumer(
  service: string,
  handle: (event: DomainEvent, source: string) => Promise<void>,
) {
  const client = kafka(service);
  return retryWorker('Kafka consumer ' + service, async (signal) => {
    await ensureTopic(client);
    if (signal.aborted) return;
    const consumer = client.consumer({
      groupId: 'svyaz-' + service + '-v1',
      allowAutoTopicCreation: false,
      retry: { restartOnFailure: async () => false },
    });
    try {
      await consumer.connect();
      await consumer.subscribe({ topic: eventTopic, fromBeginning: true });

      const ended = new AbortController();
      const off = consumer.on(consumer.events.CRASH, () => ended.abort());
      try {
        await consumer.run({
          eachMessage: async ({ message, partition, heartbeat }) => {
            const event = readEvent(message.value);
            const source = message.headers?.source?.toString();
            if (!event || !source) {
              console.error(
                'Некорректное событие Kafka',
                service,
                partition,
                message.offset,
              );
              return;
            }
            try {
              await handle(event, source);
              await heartbeat();
            } catch (error) {
              console.error('Ошибка обработки события Kafka', service, event.id);
              throw new KafkaJSError(error instanceof Error ? error : String(error), {
                retriable: true,
              });
            }
          },
        });
        const finished = AbortSignal.any([signal, ended.signal]);
        if (!finished.aborted) await once(finished, 'abort');
      } finally {
        off();
      }
    } finally {
      await consumer.disconnect();
    }
  });
}
