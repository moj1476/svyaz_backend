import type { RequestContext, SearchData, ServiceClient } from '#contracts';
import type { AccessClient } from '#contracts/access';
import { queryDispatcher } from '#runtime/query-dispatch';
import { search } from './search/query';
import type { SearchRepository } from './search-repository';

export class ReadService implements ServiceClient<'search'> {
  query = queryDispatcher({
    search: (input, context) => search(this.repository, this.access, input, context),
  });

  constructor(
    private readonly repository: SearchRepository,
    private readonly access: AccessClient,
  ) {}

  async snapshot(context: RequestContext): Promise<SearchData> {
    const workspaceIds = await this.access.workspaceIds(context);
    const documents = [];
    const limit = 100;
    let after: { key: string; id: string } | undefined;
    for (;;) {
      const batch = await this.repository.find({
        workspaceIds,
        field: 'ID',
        direction: 'ASC',
        after,
        limit,
      });
      for (const document of batch)
        if (await this.access.searchDocument(context, document)) documents.push(document);
      const last = batch.at(-1);
      if (!last || batch.length < limit) break;
      after = { key: last.id, id: last.id };
    }
    return { documents };
  }
}
