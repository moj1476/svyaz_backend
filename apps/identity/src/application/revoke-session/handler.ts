import type { IdentityData, RequestContext } from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { identifier } from '../../../../../packages/runtime/src/validation';
import type { IdentityPolicy } from '../policies/identity.policy';

export async function revokeSession(
  _domain: IdentityPolicy,
  input: CommandInput<'revokeSession'>,
  context: RequestContext,
  data: IdentityData,
): Promise<CommandOutput<'revokeSession'>> {
  const session = data.sessions.find(
    (s) => s.id === identifier(input.sessionId) && s.userId === context.userId,
  );

  if (!session) throw new DomainError('NOT_FOUND', 'Сессия не найдена');

  session.status = 'REVOKED';

  return { session };
}
