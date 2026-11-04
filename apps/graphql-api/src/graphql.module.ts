import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { backendRoot } from '../../../packages/config/src';
import { CLIENTS } from '../../../packages/contracts/src';
import { Composition } from './application/composition';
import { createContext } from './context/create-context';
import type { QueryContext } from './context/query-context';
import { createMockClients } from './mock-clients';
import { formatError } from './presentation/format-error';
import { resolvers } from './presentation/resolvers';
import { queryLimits } from './presentation/query-limits';
import { requestLogging } from './presentation/request-logging';

const lab4 = process.argv.includes('--lab4');

@Module({
  providers: [Composition, { provide: CLIENTS, useFactory: createMockClients }],
  exports: [Composition],
})
class CompositionModule {}

@Module({
  imports: [
    CompositionModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [CompositionModule],
      inject: [Composition],
      useFactory: (composition: Composition) => ({
        typeDefs: readFileSync(
          resolve(
            backendRoot(),
            `contracts/graphql/${lab4 ? 'lab4' : 'svyaz-read'}.graphql`,
          ),
          'utf8',
        ),
        resolvers: resolvers(composition, lab4),
        formatError,
        validationRules: [queryLimits()],
        plugins: [requestLogging()],
        introspection: true,
        playground: false,
        includeStacktraceInErrorResponses: false,
        context: ({
          req,
        }: {
          req: { headers: Record<string, string | undefined> };
        }): QueryContext => {
          return createContext(req.headers, composition.data);
        },
      }),
    }),
  ],
})
export class AppModule {}
