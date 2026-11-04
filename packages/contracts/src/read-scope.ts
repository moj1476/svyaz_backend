export interface ReadScope {
  readonly actorId?: string;
  readonly userIds?: readonly string[];
  readonly workspaceIds?: readonly string[];
  readonly conversationIds?: readonly string[];
  readonly messageIds?: readonly string[];
  readonly recordingFileIds?: readonly string[];
}
