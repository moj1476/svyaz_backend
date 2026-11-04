export interface Presence {
  userId: string;
  workspaceId: string;
  status: string;
  lastHeartbeat: string;
}

export interface PresenceData {
  presence: Presence[];
}
