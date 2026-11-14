import type {
  Clients,
  DataMap,
  RequestContext,
  SearchDocument,
  ServiceName,
} from '#contracts';
import type { AccessClient } from '#contracts/access';
import { hasPermission } from '#contracts/access';
import { DomainError } from '#contracts/errors';
export class ServiceDirectory implements AccessClient {
  private data<K extends ServiceName>(name: K, c: RequestContext) {
    return this.endpoints()[name].snapshot(c) as Promise<DataMap[K]>;
  }

  async userExists(id: string) {
    return (await this.endpoints().identity.userExists?.(id)) ?? false;
  }

  constructor(private readonly endpoints: () => Clients) {}

  async workspaceIds(c: RequestContext) {
    return (await this.data('workspace', c)).workspaces
      .filter((w) => w.status === 'ACTIVE')
      .map((w) => w.id);
  }

  async conversationActive(c: RequestContext, id: string) {
    return (await this.data('messaging', c)).conversations.some(
      (v) => v.id === id && v.status === 'ACTIVE',
    );
  }

  async permission(c: RequestContext, w: string, code: string) {
    const d = await this.data('workspace', c),
      m = d.memberships.find(
        (m) => m.workspaceId === w && m.userId === c.userId && m.status === 'ACTIVE',
      ),
      r = d.roles.find((r) => r.id === m?.roleId && r.workspaceId === w);

    if (!d.workspaces.some((v) => v.id === w && v.status === 'ACTIVE')) return false;

    if (
      ['messaging.write', 'calls.write', 'files.delete', 'workspace.manage'].includes(
        code,
      )
    )
      return (
        !!r &&
        (code !== 'workspace.manage'
          ? ['OWNER', 'ADMIN', 'MEMBER'].includes(r.code)
          : ['OWNER', 'ADMIN'].includes(r.code))
      );

    return hasPermission(d.memberships, d.roles, d.permissions, c.userId, w, code);
  }

  async conversationIds(c: RequestContext) {
    return (await this.data('messaging', c)).conversations.map((v) => v.id);
  }

  async conversationWorkspace(c: RequestContext, id: string) {
    const v = (await this.data('messaging', c)).conversations.find((v) => v.id === id);

    if (!v) throw new DomainError('NOT_FOUND', 'Обсуждение не найдено');

    return v.workspaceId;
  }

  async visibleUserIds(c: RequestContext) {
    return (await this.data('workspace', c)).memberships.map((m) => m.userId);
  }

  async messageIds(c: RequestContext) {
    return (await this.data('messaging', c)).messages
      .filter((m) => m.status !== 'DELETED')
      .map((m) => m.id);
  }

  async recordingFileIds(c: RequestContext) {
    return (await this.data('calls', c)).recordings
      .filter((r) => r.status === 'READY' && r.fileId)
      .map((r) => r.fileId!);
  }

  async recordingUsesFile(_c: RequestContext, fileId: string) {
    const client = this.endpoints().calls;

    if (!client.recordingUsesFile)
      throw new DomainError('UNAVAILABLE', 'Проверка записей звонков недоступна');

    return client.recordingUsesFile(fileId);
  }

  async searchDocument(c: RequestContext, d: SearchDocument) {
    if (d.sourceType === 'MESSAGE')
      return (await this.data('messaging', c)).messages.some(
        (m) =>
          m.id === d.sourceId && m.status !== 'DELETED' && m.version === d.sourceVersion,
      );

    if (d.sourceType === 'CHANNEL')
      return (await this.conversationIds(c)).includes(d.sourceId);

    if (d.sourceType === 'USER')
      return (await this.visibleUserIds(c)).includes(d.sourceId);

    if (d.sourceType === 'FILE')
      return (await this.data('files', c)).files.some(
        (f) => f.id === d.sourceId && f.status === 'READY',
      );

    return false;
  }
}
