import { DomainError, uuid } from './errors';

export function dateTime(value: unknown, name = 'DateTime'): string {
  if (typeof value !== 'string')
    throw new DomainError('VALIDATION', `${name}: требуется дата и время в UTC`);

  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);

  if (!match || !Number.isFinite(Date.parse(value)))
    throw new DomainError('VALIDATION', `${name}: неверная дата`);

  const normalized = new Date(value).toISOString();

  if (normalized !== `${match[1]}.${(match[2] ?? '').padEnd(3, '0')}Z`)
    throw new DomainError('VALIDATION', `${name}: несуществующая календарная дата`);

  return normalized;
}

export function record(value: unknown, name = 'input'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new DomainError('VALIDATION', `${name}: ожидается объект`);

  return value as Record<string, unknown>;
}

const idFields = new Set([
  'id',
  'userId',
  'workspaceId',
  'membershipId',
  'roleId',
  'teamId',
  'conversationId',
  'rootMessageId',
  'messageId',
  'senderId',
  'actorId',
  'callId',
  'sessionId',
  'fileId',
  'avatarFileId',
  'invitationId',
  'threadRootId',
  'clientMessageId',
]);

const idLists = new Set([
  'memberIds',
  'userIds',
  'fileIds',
  'conversationIds',
  'inviteeIds',
]);

export function normalizeInput(input: Record<string, unknown>): Record<string, unknown> {
  const result = { ...input };

  for (const [name, value] of Object.entries(result)) {
    if (value == null) continue;

    if (idFields.has(name)) {
      if (typeof value !== 'string')
        throw new DomainError('VALIDATION', `${name}: требуется UUID`);

      result[name] = uuid(value);
    } else if (idLists.has(name)) {
      if (!Array.isArray(value))
        throw new DomainError('VALIDATION', `${name}: ожидается список UUID`);

      result[name] = value.map((id) => {
        if (typeof id !== 'string')
          throw new DomainError('VALIDATION', `${name}: требуется UUID`);

        return uuid(id);
      });
    } else if (name === 'filter' || name === 'input')
      result[name] = normalizeInput(record(value, name));
  }

  return result;
}
