import { randomUUID } from 'node:crypto';
import type { RequestContext, WorkspaceData } from '#contracts';
import type { CommandInput, CommandOutput } from '#contracts/command-map';
import { DomainError } from '#contracts/errors';
import { identifier, text } from '#runtime/validation';
import type { WorkspacePolicy } from '../policies/workspace.policy';

export async function createTeam(
  domain: WorkspacePolicy,
  input: CommandInput<'createTeam'>,
  context: RequestContext,
  data: WorkspaceData,
): Promise<CommandOutput<'createTeam'>> {
  const workspaceId = identifier(input.workspaceId);

  domain.manager(data, context, workspaceId);

  const name = text(input.name, 'name', 120);

  if (
    data.teams.some(
      (t) => t.workspaceId === workspaceId && t.name.toLowerCase() === name.toLowerCase(),
    )
  )
    throw new DomainError('CONFLICT', 'Команда уже существует');

  const team = {
    id: randomUUID(),
    workspaceId: workspaceId,
    name,
    description:
      input.description == null ? null : text(input.description, 'description', 1000),
    status: 'ACTIVE' as const,
    membershipIds: [],
  };

  data.teams.push(team);

  return { team };
}
