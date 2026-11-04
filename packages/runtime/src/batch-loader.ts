export class BatchLoader<K, V> {
  private readonly cache = new Map<K, Promise<V>>();
  private queue = new Map<
    K,
    { resolve: (value: V) => void; reject: (error: unknown) => void }
  >();

  constructor(
    private readonly batch: (keys: readonly K[]) => Promise<ReadonlyMap<K, V>>,
  ) {}

  load(key: K): Promise<V> {
    const old = this.cache.get(key);

    if (old) return old;

    const promise = new Promise<V>((resolve, reject) => {
      this.queue.set(key, { resolve, reject });
    });

    this.cache.set(key, promise);

    if (this.queue.size === 1)
      queueMicrotask(() => {
        void this.flush();
      });

    return promise;
  }

  private async flush(): Promise<void> {
    const pending = this.queue;

    this.queue = new Map();

    try {
      const values = await this.batch([...pending.keys()]);

      for (const key of pending.keys())
        if (!values.has(key))
          throw new Error('В результате пакетного запроса отсутствует запрошенный ключ');

      for (const [key, waiter] of pending) waiter.resolve(values.get(key)!);
    } catch (error) {
      for (const [key, waiter] of pending) {
        this.cache.delete(key);
        waiter.reject(error);
      }
    }
  }
}
