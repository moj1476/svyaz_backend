import type { RequestContext, SearchDocument } from '../../packages/contracts/src';
import type { AccessClient } from '../../packages/contracts/src/access';
import { hasPermission } from '../../packages/contracts/src/access';
import { labData } from '../../packages/lab-data/src';

export class MockAccessClient implements AccessClient {
  async conversationActive(c: RequestContext, id: string) {
    return (
      (await this.conversationIds(c)).includes(id) &&
      labData.messaging.conversations.some((v) => v.id === id && v.status === 'ACTIVE')
    );
  }

  async userExists(id: string) {
    return labData.identity.users.some((u) => u.id === id && u.status === 'ACTIVE');
  }

  async conversationWorkspace(c: RequestContext, id: string) {
    const conversation = labData.messaging.conversations.find(
      (v) =>
        v.id === id &&
        labData.messaging.conversationMembers.some(
          (m) =>
            m.conversationId === id && m.userId === c.userId && m.status === 'ACTIVE',
        ),
    );

    if (!conversation) throw new Error('Обсуждение не найдено');

    return conversation.workspaceId;
  }

  async workspaceIds(c: RequestContext) {
    return labData.workspace.memberships
      .filter(
        (m) =>
          m.userId === c.userId &&
          m.status === 'ACTIVE' &&
          labData.workspace.workspaces.some(
            (w) => w.id === m.workspaceId && w.status === 'ACTIVE',
          ),
      )
      .map((m) => m.workspaceId);
  }

  async permission(c: RequestContext, workspaceId: string, code: string) {
    if (
      !labData.workspace.workspaces.some(
        (w) => w.id === workspaceId && w.status === 'ACTIVE',
      )
    )
      return false;

    if (
      ['messaging.write', 'calls.write', 'files.delete', 'workspace.manage'].includes(
        code,
      )
    ) {
      const m = labData.workspace.memberships.find(
          (m) =>
            m.workspaceId === workspaceId &&
            m.userId === c.userId &&
            m.status === 'ACTIVE',
        ),
        role = labData.workspace.roles.find((r) => r.id === m?.roleId);

      return (
        !!role &&
        (code !== 'workspace.manage'
          ? ['OWNER', 'ADMIN', 'MEMBER'].includes(role.code)
          : ['OWNER', 'ADMIN'].includes(role.code))
      );
    }

    return hasPermission(
      labData.workspace.memberships,
      labData.workspace.roles,
      labData.workspace.permissions,
      c.userId,
      workspaceId,
      code,
    );
  }

  async conversationIds(c: RequestContext) {
    const workspaces = await this.workspaceIds(c);

    return labData.messaging.conversations
      .filter(
        (v) =>
          workspaces.includes(v.workspaceId) &&
          labData.messaging.conversationMembers.some(
            (m) =>
              m.conversationId === v.id && m.userId === c.userId && m.status === 'ACTIVE',
          ),
      )
      .map((v) => v.id);
  }

  async visibleUserIds(c: RequestContext) {
    const workspaces = await this.workspaceIds(c);

    return labData.workspace.memberships
      .filter((m) => workspaces.includes(m.workspaceId))
      .map((m) => m.userId);
  }

  async messageIds(c: RequestContext) {
    const conversations = await this.conversationIds(c);

    return labData.messaging.messages
      .filter((m) => conversations.includes(m.conversationId) && m.status !== 'DELETED')
      .map((m) => m.id);
  }

  async recordingFileIds(c: RequestContext) {
    const conversations = await this.conversationIds(c);
    const calls = labData.calls.calls.filter((call) =>
      conversations.includes(call.conversationId),
    );

    return labData.calls.recordings
      .filter(
        (r) =>
          calls.some((call) => call.id === r.callId) &&
          r.status === 'READY' &&
          r.fileId !== null,
      )
      .map((r) => r.fileId!);
  }

  async searchDocument(c: RequestContext, d: SearchDocument) {
    if (d.sourceType === 'MESSAGE')
      return (
        (await this.messageIds(c)).includes(d.sourceId) &&
        labData.messaging.messages.some(
          (m) => m.id === d.sourceId && m.version === d.sourceVersion,
        )
      );

    if (d.sourceType === 'CHANNEL')
      return (await this.conversationIds(c)).includes(d.sourceId);

    if (d.sourceType === 'USER')
      return (await this.visibleUserIds(c)).includes(d.sourceId);

    if (d.sourceType === 'FILE')
      return (
        labData.files.attachments.some(
          (a) =>
            a.fileId === d.sourceId &&
            labData.messaging.messages.some(
              (m) => m.id === a.messageId && m.status !== 'DELETED',
            ),
        ) &&
        (await this.messageIds(c)).some((id) =>
          labData.files.attachments.some(
            (a) => a.messageId === id && a.fileId === d.sourceId,
          ),
        )
      );

    return false;
  }
}
