import { event, type CommandEvents } from '../../../../packages/contracts/src/events';

export const events: CommandEvents<'messaging'> = {
  createConversation: (_input, output, context) => [
    event(
      'conversation.created.v1',
      'conversation',
      output.conversation.id,
      output.conversation.workspaceId,
      context,
      { version: output.conversation.version },
    ),
  ],
  sendMessage: (_input, output, context, data) => [
    event(
      'message.created.v1',
      'message',
      output.message.id,
      data.conversations.find(
        (conversation) => conversation.id === output.message.conversationId,
      )?.workspaceId ?? null,
      context,
      {
        version: output.message.version,
        conversationId: output.message.conversationId,
        sequence: output.message.sequence,
      },
    ),
  ],
  editMessage: (_input, output, context, data) => [
    event(
      'message.updated.v1',
      'message',
      output.message.id,
      data.conversations.find(
        (conversation) => conversation.id === output.message.conversationId,
      )?.workspaceId ?? null,
      context,
      { version: output.message.version, conversationId: output.message.conversationId },
    ),
  ],
  deleteMessage: (_input, output, context, data) => [
    event(
      'message.deleted.v1',
      'message',
      output.message.id,
      data.conversations.find(
        (conversation) => conversation.id === output.message.conversationId,
      )?.workspaceId ?? null,
      context,
      { version: output.message.version, conversationId: output.message.conversationId },
    ),
  ],
  setReaction: (input, output, context, data) => [
    event(
      'reaction.state_changed.v1',
      'message',
      output.message.id,
      data.conversations.find(
        (conversation) => conversation.id === output.message.conversationId,
      )?.workspaceId ?? null,
      context,
      { emoji: input.emoji, active: input.active },
    ),
  ],
  archiveConversation: (_input, output, context) => [
    event(
      'conversation.archived.v1',
      'conversation',
      output.conversation.id,
      output.conversation.workspaceId,
      context,
      { version: output.conversation.version },
    ),
  ],
  addConversationMember: (input, output, context) => [
    event(
      'conversation.member_added.v1',
      'conversation',
      output.conversation.id,
      output.conversation.workspaceId,
      context,
      { userId: input.userId },
    ),
  ],
  markRead: (_input, output, context, data) => [
    event(
      'conversation.read_position_changed.v1',
      'conversation',
      output.readState.conversationId,
      data.conversations.find(
        (conversation) => conversation.id === output.readState.conversationId,
      )?.workspaceId ?? null,
      context,
      { sequence: output.readState.sequence },
    ),
  ],
};
