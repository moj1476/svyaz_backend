import type {
  FilesData,
  ReadRepository,
  RequestContext,
  ServiceClient,
} from '../../../../packages/contracts/src';
import type { AccessClient } from '../../../../packages/contracts/src/access';

export class ReadService implements ServiceClient<'files'> {
  constructor(
    private readonly repository: ReadRepository<FilesData>,
    private readonly access: AccessClient,
  ) {}

  async snapshot(context: RequestContext): Promise<FilesData> {
    const access = this.access;
    const workspaces = new Set(await access.workspaceIds(context));
    const messageIds = new Set(await access.messageIds(context));
    const recordingFiles = new Set(await access.recordingFileIds(context));
    const data = await this.repository.load({
      actorId: context.userId,
      workspaceIds: [...workspaces],
      messageIds: [...messageIds],
      recordingFileIds: [...recordingFiles],
    });

    const attachments = data.attachments.filter((a) => messageIds.has(a.messageId));

    return {
      files: data.files.filter(
        (f) =>
          workspaces.has(f.workspaceId) &&
          (attachments.some((a) => a.fileId === f.id) || recordingFiles.has(f.id)),
      ),
      attachments,
    };
  }
}
