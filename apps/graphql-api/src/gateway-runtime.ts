import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { createGrpcClients } from '#adapters/grpc/clients';

@Injectable()
export class GatewayRuntime implements OnApplicationShutdown {
  private readonly runtime = createGrpcClients();
  readonly auth = this.runtime.auth;
  readonly clients = this.runtime.clients;

  onApplicationShutdown() {
    this.runtime.close();
  }
}
