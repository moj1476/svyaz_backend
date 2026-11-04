import { randomUUID } from 'node:crypto';
import type {
  RequestContext,
  WorkspaceData,
} from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { text } from '../../../../../packages/runtime/src/validation';
import type { WorkspacePolicy } from '../policies/workspace.policy';

export async function createWorkspace(
  _domain: WorkspacePolicy,
  input: CommandInput<'createWorkspace'>,
  context: RequestContext,
  data: WorkspaceData,
): Promise<CommandOutput<'createWorkspace'>> {
  const name = text(input.name, 'name', 160),
    slug = text(input.slug, 'slug', 80).toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    throw new DomainError('VALIDATION', 'Неверный slug');

  if (data.workspaces.some((workspaceId) => workspaceId.slug === slug))
    throw new DomainError('CONFLICT', 'Slug уже занят');

  const workspace = {
      id: randomUUID(),
      name,
      slug,
      status: 'ACTIVE' as const,
      version: '1',
    },
    role = {
      id: randomUUID(),
      workspaceId: workspace.id,
      code: 'OWNER',
      name: 'Владелец',
      systemRole: true,
      version: '1',
      permissionIds: data.permissions.map((p) => p.id),
    };

  data.workspaces.push(workspace);
  data.roles.push(role);

  for (const [code, name] of [
    ['ADMIN', 'Администратор'],
    ['MEMBER', 'Участник'],
    ['GUEST', 'Гость'],
  ])
    data.roles.push({
      id: randomUUID(),
      workspaceId: workspace.id,
      code: code!,
      name: name!,
      systemRole: true,
      version: '1',
      permissionIds: data.permissions
        .filter(
          (p) =>
            code === 'ADMIN' ||
            (code === 'MEMBER' && p.code === 'workspace.members.read'),
        )
        .map((p) => p.id),
    });

  data.memberships.push({
    id: randomUUID(),
    workspaceId: workspace.id,
    userId: context.userId,
    roleId: role.id,
    status: 'ACTIVE' as const,
    joinedAt: new Date().toISOString(),
    version: '1',
  });
  data.policies.push({
    workspaceId: workspace.id,
    mfaRequired: false,
    guestPolicy: {},
    retentionDays: 365,
    fileRules: {},
    channelRules: {},
    version: '1',
  });

  return { workspace };
}
