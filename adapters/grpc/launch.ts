import { localOnly } from '#config';
import { DomainError, uuid } from '#contracts/errors';
import type { ServiceName } from '#contracts';
import { ServiceDirectory } from './service-directory';
import { startConsumer } from '../kafka/consumer';
import { startOutbox } from '../kafka/producer';
import { createAuth } from '#apps/identity/src/infrastructure/auth-runtime';
import {
  activeMembers,
  rolesForUser,
} from '#apps/workspace/src/infrastructure/postgres/queries/integration';
import { messageRecipients } from '#apps/messaging/src/infrastructure/postgres/message-recipients';
import { createNotificationProjector } from '#apps/notifications/src/infrastructure/postgres/event-projector';
import { searchProjection } from '#apps/messaging/src/infrastructure/postgres/search-projection';
import { recordEvent } from '#apps/audit/src/infrastructure/postgres/event-projector';
import { createIndexer } from '#apps/search/src/infrastructure/opensearch/event-indexer';
import { createGrpcClients } from './clients';
import { serve } from './server';
import { address, decode, encode, unary } from './transport';
import { Repository as identityRepository } from '#apps/identity/src/repository';
import { BusinessService as identityService } from '#apps/identity/src/operations';
import { Repository as workspaceRepository } from '#apps/workspace/src/repository';
import { BusinessService as workspaceService } from '#apps/workspace/src/operations';
import { Repository as messagingRepository } from '#apps/messaging/src/repository';
import { BusinessService as messagingService } from '#apps/messaging/src/operations';
import { Repository as filesRepository } from '#apps/files/src/repository';
import { BusinessService as filesService } from '#apps/files/src/operations';
import { Repository as notificationsRepository } from '#apps/notifications/src/repository';
import { BusinessService as notificationsService } from '#apps/notifications/src/operations';
import { Repository as callsRepository } from '#apps/calls/src/repository';
import { BusinessService as callsService } from '#apps/calls/src/operations';
import { Repository as auditRepository } from '#apps/audit/src/repository';
import { ReadService as auditService } from '#apps/audit/src/application';
import { Repository as presenceRepository } from '#apps/presence/src/repository';
import { ReadService as presenceService } from '#apps/presence/src/application';
import { Repository as searchRepository } from '#apps/search/src/repository';
import { ReadService as searchService } from '#apps/search/src/application';

type Close = () => void | Promise<unknown>;

export async function launch(name: ServiceName) {
  localOnly();
  const remote = createGrpcClients();
  const access = new ServiceDirectory(() => remote.clients);
  const closeResources: Close[] = [remote.close];
  const closeWorkers: Close[] = [];

  async function bind() {
    switch (name) {
      case 'identity': {
        const repository = new identityRepository();
        closeResources.push(() => repository.close());
        const runtime = createAuth(remote.rolesForUser);
        closeResources.push(runtime.close);
        const application = new identityService(repository, access);
        return serve(name, application, {
          userExists: unary(async ({ id }: { id: string }) => ({
            value: await application.userExists(uuid(id)),
          })),
          login: unary(async ({ inputJson, ip }: { inputJson: Buffer; ip: string }) => ({
            dataJson: encode(await runtime.auth.login(decode(inputJson), ip)),
          })),
          register: unary(
            async ({ inputJson, ip }: { inputJson: Buffer; ip: string }) => ({
              dataJson: encode(await runtime.auth.register(decode(inputJson), ip)),
            }),
          ),
          authenticate: unary(
            ({
              authorization,
              requestId,
            }: {
              authorization?: string;
              requestId: string;
            }) => runtime.auth.authenticate(authorization, uuid(requestId)),
          ),
          logout: unary(
            async ({ userId, sessionId }: { userId: string; sessionId: string }) => ({
              value: await runtime.auth.logout(uuid(userId), uuid(sessionId)),
            }),
          ),
        });
      }
      case 'workspace': {
        const repository = new workspaceRepository();
        closeResources.push(() => repository.close());
        return serve(name, new workspaceService(repository, access), {
          rolesForUser: unary(async ({ id }: { id: string }) => ({
            roles: await rolesForUser(repository.db, uuid(id)),
          })),
          activeMembers: unary(async ({ id }: { id: string }) => ({
            ids: await activeMembers(repository.db, uuid(id)),
          })),
        });
      }
      case 'messaging': {
        const repository = new messagingRepository();
        closeResources.push(() => repository.close());
        return serve(name, new messagingService(repository, access), {
          messageRecipients: unary(async ({ id }: { id: string }) => ({
            ids: await messageRecipients(repository.db, uuid(id)),
          })),
          searchProjection: unary(
            async ({
              type,
              id,
              occurredAt,
            }: {
              type: string;
              id: string;
              occurredAt: string;
            }) => {
              const date = new Date(occurredAt);
              if (
                (type !== 'message' && type !== 'conversation') ||
                !Number.isFinite(date.getTime())
              )
                throw new DomainError('VALIDATION', 'Некорректный источник поиска');
              const document = await searchProjection(
                repository.db,
                type,
                uuid(id),
                date,
              );
              return { document: document ?? undefined };
            },
          ),
        });
      }
      case 'calls': {
        const repository = new callsRepository();
        closeResources.push(() => repository.close());
        const application = new callsService(repository, access);
        return serve(name, application, {
          recordingUsesFile: unary(async ({ id }: { id: string }) => ({
            value: await application.recordingUsesFile(uuid(id)),
          })),
        });
      }
      case 'audit': {
        const repository = new auditRepository();
        closeResources.push(() => repository.close());
        const server = await serve(name, new auditService(repository, access));
        closeWorkers.push(
          startConsumer(name, (event, source) =>
            recordEvent(repository.db, event, source),
          ),
        );
        return server;
      }
      case 'search': {
        const repository = new searchRepository();
        const indexer = createIndexer(remote.searchProjection);
        closeResources.push(() => repository.close(), indexer.close);
        const server = await serve(name, new searchService(repository, access));
        closeWorkers.push(startConsumer(name, indexer.handle));
        return server;
      }
      case 'files': {
        const repository = new filesRepository();
        closeResources.push(() => repository.close());
        return serve(name, new filesService(repository, access));
      }
      case 'notifications': {
        const repository = new notificationsRepository();
        closeResources.push(() => repository.close());
        const server = await serve(name, new notificationsService(repository, access));
        closeWorkers.push(
          startConsumer(
            name,
            createNotificationProjector(
              repository.db,
              remote.messageRecipients,
              remote.activeMembers,
            ),
          ),
        );
        return server;
      }
      case 'presence': {
        const repository = new presenceRepository();
        closeResources.push(() => repository.close());
        return serve(name, new presenceService(repository, access));
      }
    }
  }

  let server: Awaited<ReturnType<typeof bind>> | undefined;
  let closing = false;
  async function close() {
    if (closing) return;
    closing = true;
    server?.forceShutdown();
    await Promise.allSettled(closeWorkers.map((stop) => Promise.resolve().then(stop)));
    await Promise.allSettled(closeResources.map((stop) => Promise.resolve().then(stop)));
  }

  try {
    server = await bind();
    if (name !== 'audit' && name !== 'presence' && name !== 'search')
      closeWorkers.push(startOutbox(name));
    console.log(`gRPC ${name} слушает ${address(name)}`);
    process.once('SIGINT', () => void close());
    process.once('SIGTERM', () => void close());
    process.once('disconnect', () => void close());
    process.send?.('ready');
  } catch (error) {
    await close();
    throw error;
  }
}
