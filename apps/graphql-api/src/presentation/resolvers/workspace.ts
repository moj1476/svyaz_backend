import type { Workspace, Membership, Role } from '../../../../../packages/contracts/src';
import type { RequestData } from '../../context/request-data';
import type { FieldResolvers } from './types';

export function workspaceFields(source: RequestData): FieldResolvers {
  return {
    Workspace: {
      myMembership: async (parent, _a, context) => {
        return (await source.data('workspace', context)).memberships.find(
          (m) =>
            m.workspaceId === (parent as Workspace).id && m.userId === context.userId,
        );
      },
      policy: async (parent, _a, context) => {
        return (await source.data('workspace', context)).policies.find(
          (p) => p.workspaceId === (parent as Workspace).id,
        );
      },
    },
    Membership: {
      user: async (parent, _a, context) => {
        return source.user(context, (parent as Membership).userId);
      },
      role: async (parent, _a, context) => {
        return (await source.data('workspace', context)).roles.find(
          (r) => r.id === (parent as Membership).roleId,
        );
      },
      teams: async (parent, _a, context) => {
        return (await source.data('workspace', context)).teams.filter((t) =>
          t.membershipIds.includes((parent as Membership).id),
        );
      },
    },
    Role: {
      permissions: async (parent, _a, context) => {
        return (await source.data('workspace', context)).permissions.filter((p) =>
          (parent as Role).permissionIds.includes(p.id),
        );
      },
    },
  };
}
