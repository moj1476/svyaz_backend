import type {
  Prisma,
  Workspace as DbWorkspace,
  Permission as DbPermission,
  Membership as DbMembership,
  SecurityPolicy as DbSecurityPolicy,
  Invitation as DbInvitation,
} from '../../../../../generated/workspace/client';
import type { WorkspaceData } from '../../../../../packages/contracts/src';
import { jsonValue } from '../../../../../packages/storage/src/values';

type Workspace = NonNullable<WorkspaceData['workspaces']>[number];

type Role = NonNullable<WorkspaceData['roles']>[number];

type Permission = NonNullable<WorkspaceData['permissions']>[number];

type Membership = NonNullable<WorkspaceData['memberships']>[number];

type Team = NonNullable<WorkspaceData['teams']>[number];

type SecurityPolicy = NonNullable<WorkspaceData['policies']>[number];

type Invitation = NonNullable<WorkspaceData['invitations']>[number];

export function fromWorkspace(row: DbWorkspace): Workspace {
  return {
    ...row,
    status: row.status as Workspace['status'],
    version: row.version.toString(),
  };
}

export function toWorkspace(row: Workspace): Prisma.WorkspaceUncheckedCreateInput {
  return { ...row, version: BigInt(row.version) };
}

export function fromRole(
  row: Prisma.RoleGetPayload<{ include: { rolePermissions: true } }>,
): Role {
  const { rolePermissions, ...data } = row;

  return {
    ...data,
    version: row.version.toString(),
    permissionIds: rolePermissions.map((link) => link.permissionId),
  };
}

export function toRole(row: Role): Prisma.RoleUncheckedCreateInput {
  const { permissionIds: _permissionIds, ...data } = row;

  return { ...data, version: BigInt(row.version) };
}

export function fromPermission(row: DbPermission): Permission {
  return { ...row };
}

export function toPermission(row: Permission): Prisma.PermissionUncheckedCreateInput {
  return { ...row };
}

export function fromMembership(row: DbMembership): Membership {
  return {
    ...row,
    status: row.status as Membership['status'],
    joinedAt: row.joinedAt.toISOString(),
    version: row.version.toString(),
  };
}

export function toMembership(row: Membership): Prisma.MembershipUncheckedCreateInput {
  return { ...row, joinedAt: new Date(row.joinedAt), version: BigInt(row.version) };
}

export function fromTeam(
  row: Prisma.TeamGetPayload<{ include: { teamMembers: true } }>,
): Team {
  const { teamMembers, ...data } = row;

  return {
    ...data,
    status: row.status as Team['status'],
    membershipIds: teamMembers.map((link) => link.membershipId),
  };
}

export function toTeam(row: Team): Prisma.TeamUncheckedCreateInput {
  const { membershipIds: _membershipIds, ...data } = row;

  return { ...data };
}

export function fromSecurityPolicy(row: DbSecurityPolicy): SecurityPolicy {
  return {
    ...row,
    guestPolicy: row.guestPolicy as SecurityPolicy['guestPolicy'],
    fileRules: row.fileRules as SecurityPolicy['fileRules'],
    channelRules: row.channelRules as SecurityPolicy['channelRules'],
    version: row.version.toString(),
  };
}

export function toSecurityPolicy(
  row: SecurityPolicy,
): Prisma.SecurityPolicyUncheckedCreateInput {
  return {
    ...row,
    guestPolicy: jsonValue(row.guestPolicy),
    fileRules: jsonValue(row.fileRules),
    channelRules: jsonValue(row.channelRules),
    version: BigInt(row.version),
  };
}

export function fromInvitation(row: DbInvitation): Invitation {
  return {
    ...row,
    status: row.status as Invitation['status'],
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function toInvitation(row: Invitation): Prisma.InvitationUncheckedCreateInput {
  return {
    ...row,
    expiresAt: new Date(row.expiresAt),
    createdAt: new Date(row.createdAt),
  };
}
