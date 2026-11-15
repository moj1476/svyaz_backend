import type { IdentityData, RequestContext } from '#contracts';
import type { CommandInput, CommandOutput } from '#contracts/command-map';
import { DomainError } from '#contracts/errors';
import { text } from '#runtime/validation';
import { version } from '#runtime/version';
import type { IdentityPolicy } from '../policies/identity.policy';

export async function updateProfile(
  _domain: IdentityPolicy,
  input: CommandInput<'updateProfile'>,
  context: RequestContext,
  data: IdentityData,
): Promise<CommandOutput<'updateProfile'>> {
  const user = data.users.find((u) => u.id === context.userId && u.status === 'ACTIVE');

  if (!user) throw new DomainError('FORBIDDEN', 'Пользователь недоступен');

  if (input.displayName === undefined && input.avatarFileId === undefined)
    throw new DomainError('VALIDATION', 'Нет изменений');

  if (input.avatarFileId !== undefined && input.avatarFileId !== null)
    throw new DomainError('VALIDATION', 'Загрузка аватара относится к следующему этапу');

  version(user, input.expectedVersion);

  if (input.displayName !== undefined)
    user.displayName = text(input.displayName, 'displayName', 160);

  if (input.avatarFileId === null) user.avatarFileId = null;

  return { user };
}
