import type { FilesData, RequestContext } from '../../../../../packages/contracts/src';
import type {
  CommandInput,
  CommandOutput,
} from '../../../../../packages/contracts/src/command-map';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import { identifier, text } from '../../../../../packages/runtime/src/validation';
import type { FilesPolicy } from '../policies/files.policy';

export async function deleteFile(
  domain: FilesPolicy,
  input: CommandInput<'deleteFile'>,
  context: RequestContext,
  data: FilesData,
): Promise<CommandOutput<'deleteFile'>> {
  const file = data.files.find((f) => f.id === identifier(input.fileId));

  if (!file) throw new DomainError('NOT_FOUND', 'Файл не найден');

  await domain.requireWorkspace(context, file.workspaceId, true);
  text(input.reason, 'reason', 500);

  if (
    file.ownerId !== context.userId &&
    !(await domain.access.permission(context, file.workspaceId, 'workspace.manage'))
  )
    throw new DomainError('FORBIDDEN', 'Нет права удаления файла');

  if (data.attachments.some((a) => a.fileId === file.id))
    throw new DomainError(
      'CONFLICT',
      'Файл используется во вложении сообщения',
      'fileId',
    );

  if (await domain.access.recordingUsesFile(context, file.id))
    throw new DomainError('CONFLICT', 'Файл используется в записи звонка', 'fileId');

  file.status = 'DELETED';

  return { file };
}
