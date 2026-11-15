import type { RequestData } from '../../context/request-data';
import { requiredRelation, type FieldResolvers } from './types';

export function workspaceFields(source: RequestData): FieldResolvers {
  return {
    Workspace: {
      myMembership: async (parent, _a, context) => {
        return requiredRelation(
          (await source.data('workspace', context)).memberships.find(
            (m) => m.workspaceId === parent.id && m.userId === context.userId,
          ),
        );
      },
      policy: async (parent, _a, context) => {
        return requiredRelation(
          (await source.data('workspace', context)).policies.find(
            (p) => p.workspaceId === parent.id,
          ),
        );
      },
    },
    Membership: {
      user: async (parent, _a, context) => {
        return requiredRelation(await source.user(context, parent.userId));
      },
      role: async (parent, _a, context) => {
        return requiredRelation(
          (await source.data('workspace', context)).roles.find(
            (r) => r.id === parent.roleId,
          ),
        );
      },
      teams: async (parent, _a, context) => {
        return (await source.data('workspace', context)).teams.filter((t) =>
          t.membershipIds.includes(parent.id),
        );
      },
    },
    Role: {
      permissions: async (parent, _a, context) => {
        return (await source.data('workspace', context)).permissions.filter((p) =>
          parent.permissionIds.includes(p.id),
        );
      },
    },
  };
}
