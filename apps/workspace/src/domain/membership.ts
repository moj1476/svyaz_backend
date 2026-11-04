import { DomainError } from '../../../../packages/contracts/src/errors';

export function assertOwnerTransition(
  actorRole: string,
  currentRole: string,
  nextRole: string | null,
  otherOwners: number,
): void {
  if ((currentRole === 'OWNER' || nextRole === 'OWNER') && actorRole !== 'OWNER')
    throw new DomainError('FORBIDDEN', 'Только владелец управляет OWNER');

  if (currentRole === 'OWNER' && nextRole !== 'OWNER' && otherOwners === 0)
    throw new DomainError('CONFLICT', 'Нельзя удалить последнего владельца');
}
