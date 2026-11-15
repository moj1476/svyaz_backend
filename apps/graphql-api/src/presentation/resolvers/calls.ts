import type { RequestData } from '../../context/request-data';
import { requiredRelation, type FieldResolvers } from './types';

export function callsFields(source: RequestData): FieldResolvers {
  return {
    Call: {
      participants: async (parent, _a, context) => {
        return (await source.data('calls', context)).participants.filter(
          (p) => p.callId === parent.id,
        );
      },
      recordings: async (parent, _a, context) => {
        return (await source.data('calls', context)).recordings.filter(
          (r) => r.callId === parent.id,
        );
      },
    },
    CallParticipant: {
      user: async (parent, _a, context) => {
        return requiredRelation(await source.user(context, parent.userId));
      },
    },
  };
}
