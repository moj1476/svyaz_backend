import { DomainError } from '#contracts/errors';
import type { Conversation } from '#contracts';

export function assertWritable(conversation: Pick<Conversation, 'status'>): void {
  if (conversation.status !== 'ACTIVE')
    throw new DomainError('INVALID_STATE', 'Обсуждение архивировано');
}
