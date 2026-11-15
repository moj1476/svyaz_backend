import type { RequestContext, SearchDocument } from '#contracts';
import type { AccessClient } from '#contracts/access';
import { cursorPlan } from '#contracts/cursor';
import { DomainError } from '#contracts/errors';
import type { QueryInput, QueryOutput } from '#contracts/queries';
import { identifier, text } from '#runtime/validation';
import { dateRange } from '#runtime/read-processing';
import type { SearchRepository } from '../search-repository';

export async function search(
  repository: SearchRepository,
  access: AccessClient,
  input: QueryInput<'search'>,
  context: RequestContext,
): Promise<QueryOutput<'search'>> {
  const filter = input.input;
  const workspaceId = identifier(filter.workspaceId);
  if (!(await access.workspaceIds(context)).includes(workspaceId))
    throw new DomainError('FORBIDDEN', 'Пространство недоступно');

  dateRange(filter);
  const term = text(filter.text, 'text', 200);
  if (
    filter.types?.some((type) => !['MESSAGE', 'FILE', 'USER', 'CHANNEL'].includes(type))
  )
    throw new DomainError('VALIDATION', 'Неверный тип поиска');

  const plan = cursorPlan(
    { ...input, filter },
    `search:${context.userId}`,
    { ID: 'string', TITLE: 'string' },
    'ID',
  );
  const field = plan.field === 'TITLE' ? 'TITLE' : 'ID';
  const key = (document: SearchDocument) =>
    field === 'TITLE' ? document.title : document.id;
  const found: SearchDocument[] = [];
  let after = plan.after;
  const limit = Math.max(50, plan.first + 1);
  while (found.length <= plan.first) {
    const batch = await repository.find({
      workspaceIds: [workspaceId],
      text: term,
      types: filter.types ?? undefined,
      conversationIds: filter.conversationIds ?? undefined,
      from: filter.from ?? undefined,
      to: filter.to ?? undefined,
      field,
      direction: plan.direction === 'DESC' ? 'DESC' : 'ASC',
      after,
      limit,
    });
    for (const document of batch) {
      if (await access.searchDocument(context, document)) found.push(document);
      if (found.length > plan.first) break;
    }
    const last = batch.at(-1);
    if (!last || batch.length < limit) break;
    after = { key: key(last), id: last.id };
  }
  const edges = found
    .slice(0, plan.first)
    .map((node) => ({ node, cursor: plan.encode(key(node), node.id) }));
  return {
    edges,
    pageInfo: {
      hasNextPage: found.length > plan.first,
      endCursor: edges.at(-1)?.cursor ?? null,
    },
  };
}
