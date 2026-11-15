import * as grpc from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { AsyncLocalStorage } from 'node:async_hooks';
import { join } from 'node:path';
import { backendRoot } from '#config';
import { services, type ServiceName } from '#contracts';
import { DomainError, type ErrorCode } from '#contracts/errors';

const definition = loadSync(join(backendRoot(), 'contracts/grpc/services.proto'), {
  arrays: true,
});
const namespace = (grpc.loadPackageDefinition(definition).svyaz as grpc.GrpcObject)
  .v1 as Record<string, grpc.ServiceClientConstructor>;
const deadlines = new AsyncLocalStorage<number>();
const options = {
  'grpc.max_receive_message_length': 32 * 1024 * 1024,
  'grpc.max_send_message_length': 32 * 1024 * 1024,
};

function contract(service: ServiceName) {
  return namespace[service[0]!.toUpperCase() + service.slice(1)]!;
}

export function address(service: ServiceName) {
  const port = Number(process.env.GRPC_BASE_PORT ?? 44051) + services.indexOf(service);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error('Некорректный GRPC_BASE_PORT');
  return '127.0.0.1:' + port;
}

const statuses: Record<ErrorCode, grpc.status> = {
  NOT_FOUND: grpc.status.NOT_FOUND,
  FORBIDDEN: grpc.status.PERMISSION_DENIED,
  VALIDATION: grpc.status.INVALID_ARGUMENT,
  UNAVAILABLE: grpc.status.UNAVAILABLE,
  UNAUTHENTICATED: grpc.status.UNAUTHENTICATED,
  INVALID_CREDENTIALS: grpc.status.UNAUTHENTICATED,
  RATE_LIMITED: grpc.status.RESOURCE_EXHAUSTED,
  CONFLICT: grpc.status.ALREADY_EXISTS,
  STALE_VERSION: grpc.status.ABORTED,
  INVALID_STATE: grpc.status.FAILED_PRECONDITION,
};

export function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value ?? null));
}

export function decode<T>(value: Buffer): T {
  try {
    return JSON.parse(value.toString('utf8')) as T;
  } catch {
    throw new DomainError('VALIDATION', 'Некорректный JSON в gRPC-запросе');
  }
}

export function connect(service: ServiceName) {
  const Client = contract(service);
  const channel = new Client(
    address(service),
    grpc.credentials.createInsecure(),
    options,
  );
  return {
    close: () => channel.close(),
    supports: (method: string) => typeof channel[method] === 'function',
    call<T>(method: string, request: object) {
      return new Promise<T>((resolve, reject) => {
        const invoke = channel[method] as (
          input: object,
          options: grpc.CallOptions,
          callback: (error: grpc.ServiceError | null, result: T) => void,
        ) => void;
        invoke.call(
          channel,
          request,
          { deadline: Math.min(deadlines.getStore() ?? Infinity, Date.now() + 12000) },
          (error, result) => {
            if (!error) return resolve(result);
            const code = String(error.metadata.get('domain-code')[0] ?? '');
            if (Object.hasOwn(statuses, code)) {
              const field = error.metadata.get('domain-field')[0];
              return reject(
                new DomainError(
                  code as ErrorCode,
                  error.details,
                  field ? String(field) : null,
                ),
              );
            }
            reject(new DomainError('UNAVAILABLE', `Сервис ${service} недоступен`));
          },
        );
      });
    },
  };
}

export async function listen(
  service: ServiceName,
  handlers: grpc.UntypedServiceImplementation,
) {
  const server = new grpc.Server(options);
  server.addService(contract(service).service, handlers);
  await new Promise<void>((resolve, reject) =>
    server.bindAsync(
      address(service),
      grpc.ServerCredentials.createInsecure(),
      (error) => (error ? reject(error) : resolve()),
    ),
  );
  return server;
}

export function unary<I, O>(handler: (input: I) => O | Promise<O>) {
  return (call: grpc.ServerUnaryCall<I, O>, callback: grpc.sendUnaryData<O>) => {
    void Promise.resolve()
      .then(() => deadlines.run(Number(call.getDeadline()), () => handler(call.request)))
      .then((result) => callback(null, result))
      .catch((error: unknown) => {
        const metadata = new grpc.Metadata();
        if (error instanceof DomainError) {
          metadata.set('domain-code', error.code);
          if (error.field) metadata.set('domain-field', error.field);
          return callback({
            code: statuses[error.code],
            details: error.message,
            metadata,
          });
        }
        console.error(
          'Ошибка gRPC',
          call.getPath(),
          error instanceof Error ? error.name : '',
        );
        callback({
          code: grpc.status.UNAVAILABLE,
          details: 'Ошибка зависимости',
          metadata,
        });
      });
  };
}
