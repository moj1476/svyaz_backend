import type { RequestData } from '../../context/request-data';
import { requiredRelation, type FieldResolvers } from './types';

export function filesFields(source: RequestData): FieldResolvers {
  return {
    Attachment: {
      file: async (parent, _a, context) => {
        return requiredRelation(
          (await source.data('files', context)).files.find((f) => f.id === parent.fileId),
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
