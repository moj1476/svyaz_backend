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
import { LocalRuntime } from './local-runtime';
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
    LocalRuntime,
    {
      provide: CLIENTS,
      inject: [LocalRuntime],
      useFactory: (runtime: LocalRuntime) => runtime.clients,
    },
  ],
  exports: [Composition, LocalRuntime],
})
class CompositionModule {}

@Module({
  imports: [
    CompositionModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [CompositionModule],
      inject: [Composition, LocalRuntime],
      useFactory: (composition: Composition, runtime: LocalRuntime) => ({
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
