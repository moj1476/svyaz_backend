import { DomainError } from '../../../../packages/contracts/src/errors';
import type { Conversation } from '../../../../packages/contracts/src';

export function assertWritable(conversation: Pick<Conversation, 'status'>): void {
  if (conversation.status !== 'ACTIVE')
    throw new DomainError('INVALID_STATE', 'Обсуждение архивировано');
}
