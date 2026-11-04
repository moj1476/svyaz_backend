import type { CallMode, CallStatus } from '../inputs';

export interface Call {
  initiatorId?: string | null;
  id: string;
  workspaceId: string;
  conversationId: string;
  mode: CallMode;
  status: CallStatus;
  startedAt: string | null;
  endedAt: string | null;
}

export interface CallParticipant {
  id: string;
  callId: string;
  userId: string;
  status: string;
  joinedAt: string | null;
  leftAt: string | null;
}

export interface Recording {
  id: string;
  callId: string;
  fileId: string | null;
  egressId: string;
  storageKey: string | null;
  status: string;
}

export interface CallsData {
  calls: Call[];
  participants: CallParticipant[];
  recordings: Recording[];
}
