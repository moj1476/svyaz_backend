import type { DataMap } from '../../contracts/src';
import { id, ids, at } from './ids';

export function createCallsData(): DataMap['calls'] {
  const data: DataMap['calls'] = {
    calls: [
      {
        id: id(400),
        workspaceId: id(10),
        conversationId: id(30),
        mode: 'VIDEO',
        status: 'ACTIVE' as const,
        startedAt: at,
        endedAt: null,
      },
      {
        id: id(401),
        workspaceId: id(10),
        conversationId: id(30),
        mode: 'AUDIO',
        status: 'ENDED' as const,
        startedAt: at,
        endedAt: '2026-11-02T09:10:00.000Z',
      },
    ],
    participants: [
      {
        id: id(410),
        callId: id(400),
        userId: id(1),
        status: 'JOINED' as const,
        joinedAt: at,
        leftAt: null,
      },
    ],
    recordings: [
      {
        id: id(420),
        callId: id(401),
        fileId: id(201),
        egressId: 'lab-egress',
        storageKey: 'lab/recording.webm',
        status: 'READY' as const,
      },
      {
        id: id(421),
        callId: id(400),
        fileId: null,
        egressId: 'lab-pending',
        storageKey: null,
        status: 'STARTING' as const,
      },
    ],
  };
  for (const call of data.calls)
    call.initiatorId =
      data.participants.find((p) => p.callId === call.id)?.userId ?? ids.alice;
  return data;
}
