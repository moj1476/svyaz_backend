import type { QueryInput, QueryOutput } from '#contracts/queries';

export interface AuditReadRepository {
  listEvents(
    input: QueryInput<'auditEvents'>,
    userId: string,
  ): Promise<QueryOutput<'auditEvents'>>;
}
