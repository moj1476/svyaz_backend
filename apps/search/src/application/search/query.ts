import type { RequestContext, SearchData } from '../../../../../packages/contracts/src';
import type { AccessClient } from '../../../../../packages/contracts/src/access';
import { DomainError } from '../../../../../packages/contracts/src/errors';
import type {
  QueryInput,
  QueryOutput,
} from '../../../../../packages/contracts/src/queries';
import { identifier, text } from '../../../../../packages/runtime/src/validation';
import {
  dateRange,
  inDates,
  page,
  type ListOptions,
} from '../../../../../packages/runtime/src/read-processing';

export async function search(
  policy: { access: AccessClient },
  input: QueryInput<'search'>,
  context: RequestContext,
  snapshot: (context: RequestContext) => Promise<SearchData>,
  _requireWorkspace: (context: RequestContext, id: string) => Promise<void>,
): Promise<QueryOutput<'search'>> {
  const searchInput = input.input,
    workspaceId = identifier(searchInput.workspaceId);

  if (!(await policy.access.workspaceIds(context)).includes(workspaceId))
    throw new DomainError('FORBIDDEN', 'Пространство недоступно');

  dateRange(searchInput);

  const search = text(searchInput.text, 'text', 200).toLowerCase();
  const types = searchInput.types ?? ['MESSAGE', 'FILE', 'USER', 'CHANNEL'];

  if (!Array.isArray(types) || !types.every((t) => typeof t === 'string'))
    throw new DomainError('VALIDATION', 'types: ожидается список строк');

  if (!types.every((t) => ['MESSAGE', 'FILE', 'USER', 'CHANNEL'].includes(t)))
    throw new DomainError('VALIDATION', 'Неверный тип поиска');

  const conversations = searchInput.conversationIds as string[] | undefined;

  conversations?.forEach((id) => identifier(id));

  const data = await snapshot(context),
    rows = data.documents.filter(
      (data) =>
        data.workspaceId === workspaceId &&
        types.includes(data.sourceType) &&
        (!conversations || conversations.includes(data.conversationId ?? '')) &&
        (data.title + ' ' + (data.snippet ?? '')).toLowerCase().includes(search) &&
        inDates(data.occurredAt, searchInput),
    );

  return page(
    rows,
    { ...input, filter: searchInput } as ListOptions,
    `search:${context.userId}`,
    { ID: (data) => data.id, TITLE: (data) => data.title },
    'ID',
  );
}
