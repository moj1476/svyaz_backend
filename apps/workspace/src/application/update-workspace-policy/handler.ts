import type {
  RequestContext,
  WorkspaceData,
} from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { bool, identifier } from '../../../../../packages/runtime/src/validation';
import { version } from '../../../../../packages/runtime/src/version';
import type { WorkspacePolicy } from '../policies/workspace.policy';

export async function updateWorkspacePolicy(
  domain: WorkspacePolicy,
  input: CommandInput<'updateWorkspacePolicy'>,
  context: RequestContext,
  data: WorkspaceData,
): Promise<CommandOutput<'updateWorkspacePolicy'>> {
  const workspaceId = identifier(input.workspaceId);

  domain.manager(data, context, workspaceId);

  const policy = data.policies.find((p) => p.workspaceId === workspaceId);

  if (!policy) throw new DomainError('NOT_FOUND', 'Политика отсутствует');

  if (
    !(
      [
        'mfaRequired',
        'retentionDays',
        'guestPolicy',
        'fileRules',
        'channelRules',
      ] as const
    ).some((k) => input[k] !== undefined)
  )
    throw new DomainError('VALIDATION', 'Нет изменений');

  if (
    input.retentionDays !== undefined &&
    (!Number.isInteger(input.retentionDays) ||
      Number(input.retentionDays) < 1 ||
      Number(input.retentionDays) > 36500)
  )
    throw new DomainError('VALIDATION', 'retentionDays от 1 до 36500');

  version(policy, input.expectedVersion);

  if (input.mfaRequired !== undefined) policy.mfaRequired = bool(input.mfaRequired);

  if (input.retentionDays !== undefined)
    policy.retentionDays = Number(input.retentionDays);

  for (const k of ['guestPolicy', 'fileRules', 'channelRules'] as const)
    if (input[k] !== undefined) {
      if (!input[k] || typeof input[k] !== 'object' || Array.isArray(input[k]))
        throw new DomainError('VALIDATION', 'Ожидался объект JSON');

      policy[k] = input[k] as object;
    }

  return { policy };
}
