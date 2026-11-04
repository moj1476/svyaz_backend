import type {
  Prisma,
  Notification as DbNotification,
} from '../../../../../generated/notifications/client';
import type { NotificationsData } from '../../../../../packages/contracts/src';
import { jsonValue } from '../../../../../packages/storage/src/values';

type Notification = NonNullable<NotificationsData['notifications']>[number];

export function fromNotification(row: DbNotification): Notification {
  return {
    ...row,
    type: row.type as Notification['type'],
    preview: row.preview as Notification['preview'],
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  };
}

export function toNotification(
  row: Notification,
): Prisma.NotificationUncheckedCreateInput {
  return {
    ...row,
    preview: jsonValue(row.preview),
    createdAt: new Date(row.createdAt),
    readAt: row.readAt == null ? null : new Date(row.readAt),
  };
}
