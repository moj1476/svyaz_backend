import type { DataMap } from '../../contracts/src';
import { id, at } from './ids';

export function createAuditData(): DataMap['audit'] {
  const data: DataMap['audit'] = {
    events: [
      {
        id: id(500),
        workspaceId: id(10),
        actorId: id(1),
        action: 'WORKSPACE_CREATED',
        targetType: 'WORKSPACE',
        targetId: id(10),
        outcome: 'SUCCESS',
        occurredAt: at,
        metadata: {},
      },
    ],
  };

  return data;
}
