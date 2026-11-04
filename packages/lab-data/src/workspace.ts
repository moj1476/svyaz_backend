import type { DataMap } from '../../contracts/src';
import { id, at } from './ids';
const policy = (workspaceId: string) => ({
  workspaceId,
  mfaRequired: false,
  guestPolicy: {},
  retentionDays: 365,
  fileRules: {},
  channelRules: {},
  version: '1',
});
export function createWorkspaceData(): DataMap['workspace'] {
  const data: DataMap['workspace'] = {
    workspaces: [
      {
        id: id(10),
        name: 'Связь',
        slug: 'svyaz',
        status: 'ACTIVE' as const,
        version: '1',
      },
      {
        id: id(11),
        name: 'Лаборатория',
        slug: 'lab',
        status: 'ACTIVE' as const,
        version: '1',
      },
    ],
    memberships: [
      {
        id: id(20),
        workspaceId: id(10),
        userId: id(1),
        roleId: id(15),
        status: 'ACTIVE' as const,
        joinedAt: at,
        version: '1',
      },
      {
        id: id(21),
        workspaceId: id(10),
        userId: id(2),
        roleId: id(16),
        status: 'ACTIVE' as const,
        joinedAt: '2026-11-02T10:00:00.000Z',
        version: '1',
      },
      {
        id: id(22),
        workspaceId: id(11),
        userId: id(1),
        roleId: id(18),
        status: 'ACTIVE' as const,
        joinedAt: at,
        version: '1',
      },
      {
        id: id(23),
        workspaceId: id(11),
        userId: id(3),
        roleId: id(17),
        status: 'ACTIVE' as const,
        joinedAt: at,
        version: '1',
      },
      {
        id: id(24),
        workspaceId: id(10),
        userId: id(4),
        roleId: id(16),
        status: 'SUSPENDED' as const,
        joinedAt: at,
        version: '1',
      },
    ],
    permissions: [
      { id: id(12), code: 'audit.read', scope: 'AUDIT' },
      { id: id(13), code: 'workspace.members.read', scope: 'WORKSPACE' },
      { id: id(14), code: 'workspace.dashboard.read', scope: 'WORKSPACE' },
    ],
    roles: [
      {
        id: id(15),
        workspaceId: id(10),
        code: 'OWNER',
        name: 'Владелец',
        systemRole: true,
        version: '1',
        permissionIds: [id(12), id(13), id(14)],
      },
      {
        id: id(16),
        workspaceId: id(10),
        code: 'MEMBER',
        name: 'Участник',
        systemRole: true,
        version: '1',
        permissionIds: [id(13)],
      },
      {
        id: id(17),
        workspaceId: id(11),
        code: 'OWNER',
        name: 'Владелец',
        systemRole: true,
        version: '1',
        permissionIds: [id(12), id(13), id(14)],
      },
      {
        id: id(18),
        workspaceId: id(11),
        code: 'GUEST',
        name: 'Гость',
        systemRole: true,
        version: '1',
        permissionIds: [],
      },
    ],
    teams: [
      {
        id: id(25),
        workspaceId: id(10),
        name: 'Разработка',
        description: null,
        status: 'ACTIVE' as const,
        membershipIds: [id(20), id(21)],
      },
    ],
    policies: [policy(id(10)), policy(id(11))],
  };
  data.invitations = [];
  let extraRoleId = 700;
  for (const workspace of data.workspaces) {
    for (const [code, name] of [
      ['OWNER', 'Владелец'],
      ['ADMIN', 'Администратор'],
      ['MEMBER', 'Участник'],
      ['GUEST', 'Гость'],
    ]) {
      if (data.roles.some((r) => r.workspaceId === workspace.id && r.code === code))
        continue;

      data.roles.push({
        id: id(extraRoleId++),
        workspaceId: workspace.id,
        code: code!,
        name: name!,
        systemRole: true,
        version: '1',
        permissionIds: data.permissions
          .filter(
            (p) =>
              ['OWNER', 'ADMIN'].includes(code!) ||
              (code === 'MEMBER' && p.code === 'workspace.members.read'),
          )
          .map((p) => p.id),
      });
    }
  }
  return data;
}
