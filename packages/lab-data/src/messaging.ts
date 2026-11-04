import type { DataMap } from '../../contracts/src';
import { id, ids } from './ids';

export function createMessagingData(): DataMap['messaging'] {
  const data: DataMap['messaging'] = {
    conversations: [
      {
        id: id(30),
        workspaceId: id(10),
        type: 'CHANNEL',
        title: 'Общий',
        visibility: 'PUBLIC',
        status: 'ACTIVE' as const,
        version: '1',
      },
      {
        id: id(31),
        workspaceId: id(10),
        type: 'CHANNEL',
        title: 'Закрытый',
        visibility: 'PRIVATE',
        status: 'ACTIVE' as const,
        version: '1',
      },
      {
        id: id(32),
        workspaceId: id(10),
        type: 'DIRECT',
        title: null,
        visibility: 'PRIVATE',
        status: 'ACTIVE' as const,
        version: '1',
      },
      {
        id: id(33),
        workspaceId: id(10),
        type: 'GROUP',
        title: 'Группа',
        visibility: 'PRIVATE',
        status: 'ACTIVE' as const,
        version: '1',
      },
      {
        id: id(34),
        workspaceId: id(11),
        type: 'CHANNEL',
        title: 'Лаборатория',
        visibility: 'PRIVATE',
        status: 'ACTIVE' as const,
        version: '1',
      },
    ],
    conversationMembers: [30, 32, 33]
      .flatMap((c) =>
        [1, 2].map((u) => ({
          conversationId: id(c),
          userId: id(u),
          status: 'ACTIVE' as const,
          joinedSeq: u === 2 ? '3' : '1',
          lastReadSeq: '1',
        })),
      )
      .concat([
        {
          conversationId: id(31),
          userId: id(2),
          status: 'ACTIVE' as const,
          joinedSeq: '1',
          lastReadSeq: '0',
        },
        {
          conversationId: id(34),
          userId: id(3),
          status: 'ACTIVE' as const,
          joinedSeq: '1',
          lastReadSeq: '0',
        },
      ]),
    messages: Array.from({ length: 7 }, (_, i) => ({
      id: id(100 + i),
      conversationId: id(30),
      senderId: id((i % 2) + 1),
      sequence: String(i + 1),
      body:
        i === 5
          ? null
          : [
              'Начало обсуждения',
              'Ответ в треде',
              'План работ',
              'Правка сообщения',
              'Ещё ответ',
              'Удалено',
              'Итог',
            ][i]!,
      status: i === 5 ? 'DELETED' : i === 3 ? 'EDITED' : 'SENT',
      threadRootId: i === 1 || i === 4 ? id(100) : null,
      sentAt: `2026-11-02T09:0${i}:00.000Z`,
      editedAt: i === 3 ? '2026-11-02T09:10:00.000Z' : null,
      version: i === 3 ? '2' : '1',
    })),
    reactions: [{ messageId: id(100), userId: id(2), emoji: '👍' }],
  };
  data.revisions = [];
  for (const conversation of data.conversations)
    conversation.createdBy =
      data.conversationMembers.find((m) => m.conversationId === conversation.id)
        ?.userId ?? ids.alice;
  return data;
}
