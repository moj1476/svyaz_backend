import type {
  ReadRepository,
  RequestContext,
  SearchData,
  ServiceClient,
} from '../../../../packages/contracts/src';
import type { AccessClient } from '../../../../packages/contracts/src/access';
import { queryDispatcher } from '../../../../packages/runtime/src/query-dispatch';
import { search } from './search/query';

export class ReadService implements ServiceClient<'search'> {
  query = queryDispatcher({
    search: (input, context) =>
      search(
        { access: this.access },
        input,
        context,
        this.snapshot.bind(this),
        async () => {},
      ),
  });

  constructor(
    private readonly repository: ReadRepository<SearchData>,
    private readonly access: AccessClient,
  ) {}

  async snapshot(context: RequestContext): Promise<SearchData> {
    const access = this.access;
    const workspaces = new Set(await access.workspaceIds(context));
    const data = await this.repository.load({
      actorId: context.userId,
      workspaceIds: [...workspaces],
    });

    const documents = [];

    for (const d of data.documents)
      if (workspaces.has(d.workspaceId) && (await access.searchDocument(context, d)))
        documents.push(d);

    return { documents };
  }
}
