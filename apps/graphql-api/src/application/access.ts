import { hasPermission } from '../../../../packages/contracts/src/access';
import { DomainError, uuid } from '../../../../packages/contracts/src/errors';
import type { RequestData } from '../context/request-data';
import type { QueryContext } from '../context/query-context';
export class Access {
  constructor(private readonly source: RequestData) {}
  async workspace(context: QueryContext, id: string) {
    uuid(id);

    return (
      (await this.source.data('workspace', context)).workspaces.find(
        (workspaceId) => workspaceId.id === id,
      ) ?? null
    );
  }
  async requireWorkspace(context: QueryContext, id: string) {
    const workspaceId = await this.workspace(context, id);

    if (!workspaceId) throw new DomainError('FORBIDDEN', 'Пространство недоступно');

    return workspaceId;
  }
  async permission(context: QueryContext, id: string, code: string) {
    await this.requireWorkspace(context, id);

    const data = await this.source.data('workspace', context);

    if (
      !hasPermission(
        data.memberships,
        data.roles,
        data.permissions,
        context.userId,
        id,
        code,
      )
    )
      throw new DomainError('FORBIDDEN', 'Недостаточно прав');
  }
  async conversation(context: QueryContext, id: string) {
    uuid(id);

    return (
      (await this.source.data('messaging', context)).conversations.find(
        (conversation) => conversation.id === id,
      ) ?? null
    );
  }
  async requireConversation(context: QueryContext, id: string) {
    const candidate = await this.conversation(context, id);

    if (!candidate) throw new DomainError('NOT_FOUND', 'Обсуждение не найдено');

    return candidate;
  }
}
