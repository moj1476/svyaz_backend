import type { GraphQLFormattedError } from 'graphql';

export function formatError(error: GraphQLFormattedError): GraphQLFormattedError {
  const messages: Record<string, string> = {
    GRAPHQL_PARSE_FAILED: 'Не удалось разобрать GraphQL-запрос',
    GRAPHQL_VALIDATION_FAILED: 'GraphQL-запрос не соответствует схеме',
    BAD_USER_INPUT: 'Некорректные параметры запроса',
    UNAUTHENTICATED: 'Требуется вход в аккаунт',
    FORBIDDEN: 'Недостаточно прав',
    PERSISTED_QUERY_NOT_FOUND: 'Сохранённый запрос не найден',
    PERSISTED_QUERY_NOT_SUPPORTED: 'Сохранённые запросы не поддерживаются',
    BAD_REQUEST: 'Некорректный запрос',
  };

  const code = error.extensions?.code;
  const message = typeof code === 'string' ? messages[code] : undefined;

  if (!message && /[А-Яа-яЁё]/.test(error.message)) return error;

  return {
    ...error,
    message: message || 'Внутренняя ошибка системы',
  };
}
