import { events } from './domain/events';
import type { RequestContext, WorkspaceData } from '../../../packages/contracts/src';
import type { AccessClient } from '../../../packages/contracts/src/access';
import type { TransactionStore } from '../../../packages/contracts/src/commands';
import { identifier } from '../../../packages/runtime/src/validation';
import { queryDispatcher } from '../../../packages/runtime/src/query-dispatch';
import { ServiceBase } from '../../../packages/runtime/src/service-base';
import { ReadService } from './application';
import { acceptInvitation } from './application/accept-invitation/handler';
import { assignTeamMember } from './application/assign-team-member/handler';
import { changeMemberRole } from './application/change-member-role/handler';
import { createTeam } from './application/create-team/handler';
import { createWorkspace } from './application/create-workspace/handler';
import { deactivateMember } from './application/deactivate-member/handler';
import { inviteMember } from './application/invite-member/handler';
import { members } from './application/members/query';
import { updateWorkspacePolicy } from './application/update-workspace-policy/handler';
import { WorkspacePolicy } from './application/policies/workspace.policy';

export class BusinessService extends ServiceBase<'workspace'> {
  private readonly policy: WorkspacePolicy;

  constructor(store: TransactionStore<WorkspaceData>, access: AccessClient) {
    const policy = new WorkspacePolicy(store, access);

    super(
      'workspace',
      store,
      access,
      new ReadService(store, access),
      {
        createWorkspace: (input, context, data) =>
          createWorkspace(policy, input, context, data),
        inviteMember: (input, context, data) =>
          inviteMember(policy, input, context, data),
        acceptInvitation: (input, context, data) =>
          acceptInvitation(policy, input, context, data),
        createTeam: (input, context, data) => createTeam(policy, input, context, data),
        assignTeamMember: (input, context, data) =>
          assignTeamMember(policy, input, context, data),
        changeMemberRole: (input, context, data) =>
          changeMemberRole(policy, input, context, data),
        deactivateMember: (input, context, data) =>
          deactivateMember(policy, input, context, data),
        updateWorkspacePolicy: (input, context, data) =>
          updateWorkspacePolicy(policy, input, context, data),
      },
      events,
      policy.authorize.bind(policy),
    );
    this.policy = policy;
  }

  private requireWorkspace(context: RequestContext, workspaceId: string, write = false) {
    return this.policy.requireWorkspace(context, workspaceId, write);
  }

  private manager(data: WorkspaceData, context: RequestContext, workspaceId: string) {
    return this.policy.manager(data, context, workspaceId);
  }

  query = queryDispatcher({
    members: (input, context) =>
      members(
        this.policy,
        input,
        context,
        this.snapshot.bind(this),
        this.requireWorkspace.bind(this),
      ),
  });

  async statistics(workspaceId: string, context: RequestContext) {
    const data = await this.store.load({
      workspaceIds: [workspaceId],
      actorId: context.userId,
    });

    this.manager(data, context, identifier(workspaceId));

    if (this.store.aggregate) return this.store.aggregate(workspaceId);

    const members = data.memberships.filter((m) => m.workspaceId === workspaceId);

    return {
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.status === 'ACTIVE').length,
      pendingInvites: (data.invitations ?? []).filter(
        (candidate) =>
          candidate.workspaceId === workspaceId &&
          candidate.status === 'PENDING' &&
          Date.parse(candidate.expiresAt) > Date.now(),
      ).length,
    };
  }
}
