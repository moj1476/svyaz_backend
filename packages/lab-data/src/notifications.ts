import type { DataMap } from '../../contracts/src';
import { id, at } from './ids';

export function createNotificationsData(): DataMap['notifications'] {
  const data: DataMap['notifications'] = {
    notifications: [1, 2].map((u) => ({
      id: id(300 + u),
      workspaceId: id(10),
      recipientId: id(u),
      type: 'MESSAGE',
      targetType: 'MESSAGE',
      targetId: id(100),
      sourceEventId: id(310),
      preview: { conversationId: id(30) },
      createdAt: at,
      readAt: null,
    })),
  };

  return data;
}
