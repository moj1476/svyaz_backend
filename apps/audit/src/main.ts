import 'reflect-metadata';
import { launch } from '../../../adapters/mocks/launch';
import { ReadService } from './application';
import { Repository } from './repository';

launch('audit', ReadService, Repository).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
