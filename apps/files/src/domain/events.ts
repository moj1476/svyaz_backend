import { event } from '../../../../packages/contracts/src/events';
import type { CommandEvents } from '../../../../packages/contracts/src/events';

export const events: CommandEvents<'files'> = {
  deleteFile: (_input, output, context) => [
    event('file.deleted.v1', 'file', output.file.id, output.file.workspaceId, context),
  ],
};
