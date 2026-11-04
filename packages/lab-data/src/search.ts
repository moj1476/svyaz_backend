import type { DataMap } from '../../contracts/src';
import { id } from './ids';

export function createSearchData(): DataMap['search'] {
  const data: DataMap['search'] = {
    documents: [
      {
        id: id(600),
        sourceId: id(100),
        sourceType: 'MESSAGE',
        workspaceId: id(10),
        conversationId: id(30),
        title: 'Начало обсуждения',
        snippet: 'Начало обсуждения',
        sourceVersion: '1',
      },
      {
        id: id(601),
        sourceId: id(31),
        sourceType: 'CHANNEL',
        workspaceId: id(10),
        conversationId: id(31),
        title: 'Закрытый',
        snippet: null,
        sourceVersion: '1',
      },
      {
        id: id(602),
        sourceId: id(999),
        sourceType: 'MESSAGE',
        workspaceId: id(10),
        conversationId: id(30),
        title: 'Удалённый устаревший результат',
        snippet: null,
        sourceVersion: '1',
      },
      {
        id: id(603),
        sourceId: id(2),
        sourceType: 'USER',
        workspaceId: id(10),
        conversationId: null,
        title: 'Борис',
        snippet: null,
        sourceVersion: '1',
      },
      {
        id: id(604),
        sourceId: id(200),
        sourceType: 'FILE',
        workspaceId: id(10),
        conversationId: id(30),
        title: 'План.txt',
        snippet: null,
        sourceVersion: '1',
      },
    ],
  };
  for (const document of data.documents) document.occurredAt = '2026-11-02T09:00:00.000Z';
  return data;
}
