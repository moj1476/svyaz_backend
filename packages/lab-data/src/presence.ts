import type { DataMap } from '../../contracts/src';
import { id, at } from './ids';

export function createPresenceData(): DataMap['presence'] {
  const data: DataMap['presence'] = {
    presence: [
      {
        userId: id(1),
        workspaceId: id(10),
        status: 'ONLINE' as const,
        lastHeartbeat: at,
      },
    ],
  };

  return data;
}
