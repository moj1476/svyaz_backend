import type { SqlService } from '../../packages/storage/src/connection';
import { seedIdentity } from './identity';
import { seedWorkspace } from './workspace';
import { seedMessaging } from './messaging';
import { seedFiles } from './files';
import { seedNotifications } from './notifications';
import { seedCalls } from './calls';
import { seedAudit } from './audit';
const seeders: Record<SqlService, () => Promise<void>> = {
  identity: seedIdentity,
  workspace: seedWorkspace,
  messaging: seedMessaging,
  files: seedFiles,
  notifications: seedNotifications,
  calls: seedCalls,
  audit: seedAudit,
};
export async function seedSql(service: SqlService): Promise<void> {
  await seeders[service]();
  console.log(`${service}: seeded through Prisma`);
}
