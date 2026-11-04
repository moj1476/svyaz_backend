import type {
  Prisma,
  User as DbUser,
  Device as DbDevice,
  Session as DbSession,
} from '../../../../../generated/identity/client';
import type { IdentityData } from '../../../../../packages/contracts/src';

type User = NonNullable<IdentityData['users']>[number];

type Device = NonNullable<IdentityData['devices']>[number];

type Session = NonNullable<IdentityData['sessions']>[number];

export function fromUser(row: DbUser): User {
  return {
    ...row,
    status: row.status as User['status'],
    version: row.version.toString(),
  };
}

export function toUser(row: User): Prisma.UserUncheckedCreateInput {
  return { ...row, version: BigInt(row.version) };
}

export function fromDevice(row: DbDevice): Device {
  return { ...row, lastSeenAt: row.lastSeenAt.toISOString() };
}

export function toDevice(row: Device): Prisma.DeviceUncheckedCreateInput {
  return { ...row, lastSeenAt: new Date(row.lastSeenAt) };
}

export function fromSession(row: DbSession): Session {
  return {
    ...row,
    status: row.status as Session['status'],
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
  };
}

export function toSession(row: Session): Prisma.SessionUncheckedCreateInput {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    expiresAt: new Date(row.expiresAt),
    lastSeenAt: new Date(row.lastSeenAt),
  };
}
