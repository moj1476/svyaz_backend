import type { DataMap } from '../../contracts/src';
import { id, at } from './ids';

export function createIdentityData(): DataMap['identity'] {
  const data: DataMap['identity'] = {
    users: ['alice', 'bob', 'outsider', 'suspended'].map((login, i) => ({
      id: id(i + 1),
      login,
      displayName: ['Алиса', 'Борис', 'Виктор', 'Глеб'][i]!,
      status: 'ACTIVE' as const,
      avatarFileId: null,
      version: '1',
    })),
    devices: [
      {
        id: id(5),
        platform: 'WEB',
        name: 'Учебный браузер',
        trusted: false,
        lastSeenAt: at,
      },
    ],
    sessions: [
      {
        id: id(6),
        userId: id(1),
        deviceId: id(5),
        status: 'ACTIVE' as const,
        createdAt: at,
        expiresAt: '2099-01-01T00:00:00.000Z',
        lastSeenAt: at,
      },
    ],
  };

  return data;
}
