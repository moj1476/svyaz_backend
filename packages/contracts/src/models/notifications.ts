export interface Notification {
  id: string;
  workspaceId: string;
  recipientId: string;
  type: string;
  targetType: string;
  targetId: string;
  sourceEventId: string;
  preview: object;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationsData {
  notifications: Notification[];
}
