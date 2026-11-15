import { z } from 'zod';
import type { JsonValue } from './json-value';
import { DomainError, uuid } from './errors';
import { dateTime } from './validation';
const long = z
  .string({ error: 'ожидается точный int64 строкой' })
  .refine(
    (input) =>
      /^-?\d+$/.test(input) && BigInt(input) >= -(2n ** 63n) && BigInt(input) < 2n ** 63n,
    { error: 'ожидается точный int64 строкой' },
  )
  .transform((input) => BigInt(input).toString());

export const wireScalars = {
  ID: z.string({ error: 'ожидается строка' }).transform((input, ctx) => {
    try {
      return uuid(input);
    } catch (error) {
      if (!(error instanceof DomainError)) throw error;
      ctx.addIssue({ code: 'custom', message: error.message });
      return z.NEVER;
    }
  }),
  DateTime: z.string({ error: 'ожидается строка' }).transform((input, ctx) => {
    try {
      return dateTime(input);
    } catch (error) {
      if (!(error instanceof DomainError)) throw error;
      ctx.addIssue({ code: 'custom', message: error.message.replace(/^DateTime: /, '') });
      return z.NEVER;
    }
  }),
  Long: long,
  Int: z.int32({ error: 'ожидается int32' }),
  Boolean: z.boolean({ error: 'ожидается логическое значение' }),
  JSON: z.custom<JsonValue>((input) => input != null, { error: 'обязательное поле' }),
};
