import { event } from '#contracts/events';
import type { CommandEvents } from '#contracts/events';

export const events: CommandEvents<'files'> = {
  deleteFile: (_input, output, context) => [
    event('file.deleted.v1', 'file', output.file.id, output.file.workspaceId, context),
  ],
};
