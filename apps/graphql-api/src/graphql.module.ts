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
import { createLocalRuntime, LOCAL_RUNTIME } from './mock-clients';
import { formatError } from './presentation/format-error';
import { resolvers } from './presentation/resolvers';
import { queryLimits } from './presentation/query-limits';
import { requestLogging } from './presentation/request-logging';

const businessApi = !process.argv.includes('--read-only');
type LocalRuntime = ReturnType<typeof createLocalRuntime>;

@Module({
  providers: [
    Composition,
    { provide: LOCAL_RUNTIME, useFactory: () => createLocalRuntime(businessApi) },
    {
      provide: CLIENTS,
      inject: [LOCAL_RUNTIME],
      useFactory: (runtime: LocalRuntime) => runtime.clients,
    },
  ],
  exports: [Composition, LOCAL_RUNTIME],
})
class CompositionModule {}

@Module({
  imports: [
    CompositionModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [CompositionModule],
      inject: [Composition, LOCAL_RUNTIME],
      useFactory: (composition: Composition, runtime: LocalRuntime) => ({
        typeDefs: readFileSync(
          resolve(
            backendRoot(),
            `contracts/graphql/${businessApi ? 'lab4' : 'svyaz-read'}.graphql`,
          ),
          'utf8',
        ),
        resolvers: resolvers(composition, businessApi),
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
          return createContext(req.headers, composition.data, runtime.users);
        },
      }),
    }),
  ],
})
export class AppModule {}
