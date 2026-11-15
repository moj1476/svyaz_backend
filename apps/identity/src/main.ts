import 'reflect-metadata';
import { launch } from '#adapters/grpc/launch';

launch('identity').catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
