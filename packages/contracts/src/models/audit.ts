export interface AuditEvent {
  id: string;
  workspaceId: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  outcome: string;
  occurredAt: string;
  metadata: object;
}

export interface AuditData {
  events: AuditEvent[];
}
