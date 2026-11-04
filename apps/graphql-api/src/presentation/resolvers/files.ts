import type { Attachment } from '../../../../../packages/contracts/src';
import type { RequestData } from '../../context/request-data';
import type { FieldResolvers } from './types';

export function filesFields(source: RequestData): FieldResolvers {
  return {
    Attachment: {
      file: async (parent, _a, context) => {
        return (await source.data('files', context)).files.find(
          (f) => f.id === (parent as Attachment).fileId,
        );
      },
    },
    File: {
      downloadUrl: async (_parent, _a, _context) => {
        return null;
      },
    },
  };
}
