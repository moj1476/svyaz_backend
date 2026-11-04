import { createIdentityData } from './identity';
import { createWorkspaceData } from './workspace';
import { createMessagingData } from './messaging';
import { createFilesData } from './files';
import { createNotificationsData } from './notifications';
import { createCallsData } from './calls';
import { createAuditData } from './audit';
import { createPresenceData } from './presence';
import { createSearchData } from './search';
import type { DataMap } from '../../contracts/src';
export function createLabData(): DataMap {
  return {
    identity: createIdentityData(),
    workspace: createWorkspaceData(),
    messaging: createMessagingData(),
    files: createFilesData(),
    notifications: createNotificationsData(),
    calls: createCallsData(),
    audit: createAuditData(),
    presence: createPresenceData(),
    search: createSearchData(),
  };
}
