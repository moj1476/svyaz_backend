import 'reflect-metadata';
import { launch } from '#adapters/grpc/launch';

launch('presence').catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
