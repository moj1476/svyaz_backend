import type {
  CallsData,
  ReadRepository,
  RequestContext,
  ServiceClient,
} from '../../../../packages/contracts/src';
import type { AccessClient } from '../../../../packages/contracts/src/access';

export class ReadService implements ServiceClient<'calls'> {
  constructor(
    private readonly repository: ReadRepository<CallsData>,
    private readonly access: AccessClient,
  ) {}

  async snapshot(context: RequestContext): Promise<CallsData> {
    const access = this.access;
    const ids = new Set(await access.conversationIds(context));
    const data = await this.repository.load({
      actorId: context.userId,
      conversationIds: [...ids],
    });

    const calls = data.calls.filter((c) => ids.has(c.conversationId));

    return {
      calls,
      participants: data.participants.filter((p) => calls.some((c) => c.id === p.callId)),
      recordings: data.recordings.filter((r) => calls.some((c) => c.id === r.callId)),
    };
  }
}
