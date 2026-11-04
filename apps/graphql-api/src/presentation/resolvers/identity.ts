import type { Session } from '../../../../../packages/contracts/src';
import type { RequestData } from '../../context/request-data';
import type { FieldResolvers } from './types';

export function identityFields(source: RequestData): FieldResolvers {
  return {
    Session: {
      device: async (parent, _a, context) => {
        return (
          (await source.data('identity', context)).devices.find(
            (data) => data.id === (parent as Session).deviceId,
          ) ?? null
        );
      },
    },
  };
}
