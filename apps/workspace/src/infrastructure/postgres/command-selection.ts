import type { WorkspaceData } from '../../../../../packages/contracts/src';

import type { Prisma } from '../../../../../generated/workspace/client';

import { type CommandSelection } from '../../../../../packages/storage/src/transactional-repository';
import type { RequestContext } from '../../../../../packages/contracts/src';

import { loadState, loadWorkspaceState } from './state-loader';

export async function selectCommandState(
  client: Prisma.TransactionClient,
  operation: string,
  input: Record<string, unknown>,
  _context: RequestContext,
): Promise<CommandSelection<WorkspaceData>> {
  if (operation === 'createWorkspace') {
    const slug = String(input.slug).toLowerCase();

    return {
      lock: 'workspace-slug:' + slug,
      load: () => loadState(client, { workspaces: { slug }, permissions: {} }),
    };
  }

  const workspaceId =
    operation === 'acceptInvitation'
      ? (
          await client.invitation.findUnique({
            where: { id: String(input.invitationId) },
            select: { workspaceId: true },
          })
        )?.workspaceId
      : typeof input.workspaceId === 'string'
        ? input.workspaceId
        : undefined;

  return {
    lock: 'workspace:' + String(workspaceId ?? input.invitationId),
    load: () => loadWorkspaceState(client, workspaceId ? [workspaceId] : []),
  };
}
