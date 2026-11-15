import { DomainError } from '#contracts/errors';
import type { Message } from '#contracts';

export function assertMessagePresent(message: Pick<Message, 'status'>): void {
  if (message.status === 'DELETED')
    throw new DomainError('INVALID_STATE', 'Сообщение удалено');
}

export function assertMessageAuthor(
  message: Pick<Message, 'senderId'>,
  actorId: string,
): void {
  if (message.senderId !== actorId)
    throw new DomainError('FORBIDDEN', 'Изменять сообщение может автор');
}
