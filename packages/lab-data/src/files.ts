import type { DataMap } from '../../contracts/src';
import { id } from './ids';

export function createFilesData(): DataMap['files'] {
  const data: DataMap['files'] = {
    files: [
      {
        id: id(200),
        workspaceId: id(10),
        ownerId: id(1),
        name: 'План.txt',
        mimeType: 'text/plain',
        sizeBytes: '42',
        status: 'READY' as const,
        objectKey: 'lab/plan.txt',
      },
      {
        id: id(201),
        workspaceId: id(10),
        ownerId: id(2),
        name: 'Запись.webm',
        mimeType: 'video/webm',
        sizeBytes: '9007199254740993',
        status: 'READY' as const,
        objectKey: 'lab/recording.webm',
      },
    ],
    attachments: [{ id: id(210), messageId: id(100), fileId: id(200) }],
  };

  return data;
}
