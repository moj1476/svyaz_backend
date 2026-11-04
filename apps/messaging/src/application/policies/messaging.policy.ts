import { assertWritable } from '../../domain/conversation';
import type {
  Conversation,
  MessagingData,
  RequestContext,
} from '../../../../../packages/contracts/src';
import type { AccessClient } from '../../../../../packages/contracts/src/access';
import type { TransactionStore } from '../../../../../packages/contracts/src/commands';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { identifier } from '../../../../../packages/runtime/src/validation';
import type { MessagingReadRepository } from '../ports/read-repository';

export class MessagingPolicy {
  constructor(
    public readonly store: TransactionStore<MessagingData> &
      Partial<MessagingReadRepository>,
    public readonly access: AccessClient,
  ) {}

  async authorize(op: string, input: Record<string, unknown>, context: RequestContext) {
    if (op === 'createConversation') {
      await this.requireWorkspace(context, identifier(input.workspaceId), true);

      return;
    }

    const data = await this.store.load(),
      id =
        input.conversationId ??
        data.messages.find((m) => m.id === input.messageId)?.conversationId;

    if (input.messageId && !id)
      throw new DomainError('NOT_FOUND', 'Сообщение не найдено');

    const conversation = await this.conversation(data, context, id);

    await this.requireWorkspace(context, conversation.workspaceId, op !== 'markRead');
  }

  async conversation(
    data: MessagingData,
    context: RequestContext,
    id: unknown,
    write = false,
  ) {
    const conversationId = identifier(id);
    const candidate = data.conversations.find(
      (conversation) => conversation.id === conversationId,
    );

    if (
      !candidate ||
      !data.conversationMembers.some(
        (m) =>
          m.conversationId === candidate.id &&
          m.userId === context.userId &&
          m.status === 'ACTIVE',
      )
    )
      throw new DomainError('NOT_FOUND', 'Обсуждение не найдено');

    await this.requireWorkspace(context, candidate.workspaceId, write);

    if (write) assertWritable(candidate);

    return candidate;
  }

  async manage(conversation: Conversation, context: RequestContext) {
    if (
      conversation.createdBy !== context.userId &&
      !(await this.access.permission(
        context,
        conversation.workspaceId,
        'workspace.manage',
      ))
    )
      throw new DomainError('FORBIDDEN', 'Нужно право управления обсуждением');
  }

  async requireWorkspace(context: RequestContext, workspaceId: string, write = false) {
    if (!(await this.access.workspaceIds(context)).includes(workspaceId))
      throw new DomainError('FORBIDDEN', 'Нет активного членства');

    if (write && !(await this.access.permission(context, workspaceId, 'messaging.write')))
      throw new DomainError('FORBIDDEN', 'Нет права изменения ресурса');
  }
}
