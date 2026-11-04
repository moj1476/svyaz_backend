import type {
  QueryInput,
  QueryOutput,
} from '../../../../../packages/contracts/src/queries';

export interface AuditReadRepository {
  listEvents(
    input: QueryInput<'auditEvents'>,
    userId: string,
  ): Promise<QueryOutput<'auditEvents'>>;
}
