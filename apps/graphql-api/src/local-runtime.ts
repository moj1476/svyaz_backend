import {
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { createLocalClients } from '#adapters/local/clients';
import { SearchIndexer } from '#adapters/local/search-indexer';
import { createLocalAuth } from '#adapters/local/auth';

@Injectable()
export class LocalRuntime implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly authRuntime = createLocalAuth();
  readonly auth = this.authRuntime.auth;
  private readonly runtime = createLocalClients();
  readonly clients = this.runtime.clients;

  private readonly indexer = new SearchIndexer();

  onApplicationBootstrap() {
    this.indexer.start();
  }

  async onApplicationShutdown() {
    await Promise.all([
      this.runtime.close(),
      this.indexer.close(),
      this.authRuntime.close(),
    ]);
  }
}
