import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GraphQLModule } from '@nestjs/graphql';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { backendRoot } from '#config';
import { CLIENTS, type Clients } from '#contracts';
import { ApiMutationHandler, ApiQueryHandler } from './application/api-handlers';
import { RequestData } from './context/request-data';
import { Composition } from './application/composition';
import { GraphQLContext } from './context/create-context';
import type { IncomingMessage } from 'node:http';
import { GatewayRuntime } from './gateway-runtime';
import { formatError } from './presentation/format-error';
import { resolvers } from './presentation/resolvers';
import { queryCost, queryLimits } from './presentation/query-limits';
import { requestLogging } from './presentation/request-logging';

const businessApi = !process.argv.includes('--read-only');

@Module({
  imports: [CqrsModule.forRoot()],
  providers: [
    Composition,
    ApiMutationHandler,
    ApiQueryHandler,
    {
      provide: RequestData,
      inject: [CLIENTS],
      useFactory: (clients: Clients) => new RequestData(clients),
    },
    GatewayRuntime,
    {
      provide: CLIENTS,
      inject: [GatewayRuntime],
      useFactory: (runtime: GatewayRuntime) => runtime.clients,
    },
  ],
  exports: [Composition, GatewayRuntime],
})
class CompositionModule {}

@Module({
  imports: [
    CompositionModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [CompositionModule],
      inject: [Composition, GatewayRuntime],
      useFactory: (composition: Composition, runtime: GatewayRuntime) => ({
        typeDefs: [
          readFileSync(
            resolve(
              backendRoot(),
              `contracts/graphql/${businessApi ? 'lab4' : 'svyaz-read'}.graphql`,
            ),
            'utf8',
          ),
          readFileSync(resolve(backendRoot(), 'contracts/graphql/auth.graphql'), 'utf8'),
        ],
        resolvers: resolvers(composition, businessApi),
        formatError,
        validationRules: queryLimits,
        plugins: [requestLogging(), queryCost()],
        introspection: true,
        playground: false,
        includeStacktraceInErrorResponses: false,
        context: ({ req }: { req: IncomingMessage }) =>
          new GraphQLContext(
            runtime,
            req.headers.authorization,
            req.socket.remoteAddress ?? 'local',
          ),
      }),
    }),
  ],
})
export class AppModule {}
