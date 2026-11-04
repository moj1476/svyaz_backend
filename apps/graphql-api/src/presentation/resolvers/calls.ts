import type { Call, CallParticipant } from '../../../../../packages/contracts/src';
import type { RequestData } from '../../context/request-data';
import type { FieldResolvers } from './types';

export function callsFields(source: RequestData): FieldResolvers {
  return {
    Call: {
      participants: async (parent, _a, context) => {
        return (await source.data('calls', context)).participants.filter(
          (p) => p.callId === (parent as Call).id,
        );
      },
      recordings: async (parent, _a, context) => {
        return (await source.data('calls', context)).recordings.filter(
          (r) => r.callId === (parent as Call).id,
        );
      },
    },
    CallParticipant: {
      user: async (parent, _a, context) => {
        return source.user(context, (parent as CallParticipant).userId);
      },
    },
  };
}
