import type { User } from '#contracts';
import { DomainError } from '#contracts/errors';
import type { Composition } from '../../application/composition';
import type { QueryContext } from '../../context/query-context';
import type { GatewayResolver } from '../resolvers';

export function authFields(composition: Composition) {
  async function viewer(context: QueryContext, knownUser?: User) {
    const user = knownUser ?? (await composition.data.user(context, context.userId));
    if (!user) throw new DomainError('UNAUTHENTICATED', 'Требуется вход в аккаунт');
    const data = await composition.data.data('workspace', context);
    const memberships = context.workspaceRoles.flatMap(
      ({ workspaceId, roleId, code }) => {
        const workspace = data.workspaces.find((item) => item.id === workspaceId);
        const role = data.roles.find((item) => item.id === roleId);
        if (!workspace || !role) return [];
        return [
          {
            workspaceId,
            name: workspace.name,
            roleId,
            roleCode: code,
            permissions: data.permissions
              .filter((permission) => role.permissionIds.includes(permission.id))
              .map((permission) => permission.code),
          },
        ];
      },
    );
    return { user, memberships };
  }

  const login: GatewayResolver = async (_parent, args, context) => {
    const { user, workspaceRoles, ...session } = await context.runtime.auth.login(
      args.input,
      context.ip,
    );
    const { sessionId } = session;
    return {
      ...session,
      viewer: await viewer(
        {
          userId: user.id,
          requestId: context.requestId,
          sessionId,
          workspaceRoles,
          cache: new Map(),
        },
        user,
      ),
    };
  };
  const register: GatewayResolver = async (_parent, args, context) => {
    const {
      user,
      workspaceRoles: _roles,
      ...session
    } = await context.runtime.auth.register(args.input, context.ip);
    return { ...session, viewer: { user, memberships: [] } };
  };
  const logout: GatewayResolver = async (_parent, _args, context) => {
    context.invalidate();
    const identity = await context.authenticated();
    const result = await context.runtime.auth.logout(identity.userId, identity.sessionId);
    context.invalidate();
    return result;
  };

  return { login, register, logout, viewer };
}
