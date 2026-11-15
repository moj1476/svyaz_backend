import { setTimeout as delay } from 'node:timers/promises';

export function retryWorker(name: string, work: (signal: AbortSignal) => Promise<void>) {
  const stop = new AbortController();
  const task = (async () => {
    while (!stop.signal.aborted) {
      try {
        await work(stop.signal);
      } catch (error) {
        if (!stop.signal.aborted)
          console.error(name, error instanceof Error ? error.name : 'Ошибка');
      }
      await delay(1500, undefined, { signal: stop.signal }).catch(() => undefined);
    }
  })();

  return async () => {
    stop.abort();
    await task;
  };
}
