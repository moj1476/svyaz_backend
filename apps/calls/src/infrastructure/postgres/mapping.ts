import type {
  Prisma,
  Call as DbCall,
  CallParticipant as DbCallParticipant,
  CallRecording as DbCallRecording,
} from '../../../../../generated/calls/client';
import type { CallsData } from '../../../../../packages/contracts/src';

type Call = NonNullable<CallsData['calls']>[number];

type CallParticipant = NonNullable<CallsData['participants']>[number];

type CallRecording = NonNullable<CallsData['recordings']>[number];

export function fromCall(row: DbCall): Call {
  return {
    ...row,
    mode: row.mode as Call['mode'],
    status: row.status as Call['status'],
    startedAt: row.startedAt?.toISOString() ?? null,
    endedAt: row.endedAt?.toISOString() ?? null,
  };
}

export function toCall(row: Call): Prisma.CallUncheckedCreateInput {
  return {
    ...row,
    startedAt: row.startedAt == null ? null : new Date(row.startedAt),
    endedAt: row.endedAt == null ? null : new Date(row.endedAt),
  };
}

export function fromCallParticipant(row: DbCallParticipant): CallParticipant {
  return {
    ...row,
    status: row.status as CallParticipant['status'],
    joinedAt: row.joinedAt?.toISOString() ?? null,
    leftAt: row.leftAt?.toISOString() ?? null,
  };
}

export function toCallParticipant(
  row: CallParticipant,
): Prisma.CallParticipantUncheckedCreateInput {
  return {
    ...row,
    joinedAt: row.joinedAt == null ? null : new Date(row.joinedAt),
    leftAt: row.leftAt == null ? null : new Date(row.leftAt),
  };
}

export function fromCallRecording(row: DbCallRecording): CallRecording {
  return { ...row, status: row.status as CallRecording['status'] };
}

export function toCallRecording(
  row: CallRecording,
): Prisma.CallRecordingUncheckedCreateInput {
  return { ...row };
}
