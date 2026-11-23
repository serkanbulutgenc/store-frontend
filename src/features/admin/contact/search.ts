import { z } from "zod";
import { listSearchSchema } from "../data-table/search";
import { THREAD_STATUSES } from "./rules";

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined);

/**
 * URL search params of the inbox: the shared page, size and `q`, plus filters. A value the API
 * would refuse (it answers 422) falls back to "no filter" instead of being passed on.
 */
export const contactSearchSchema = listSearchSchema
  .pick({ page: true, size: true, q: true })
  .extend({
    status: z
      .enum(THREAD_STATUSES as unknown as [string, ...string[]])
      .optional()
      .catch(undefined),
    category: z.coerce.number().int().positive().optional().catch(undefined),
    /** Only threads with a reply waiting for the Owner. */
    pending: z
      .union([z.boolean(), z.enum(["true"]).transform(() => true)])
      .optional()
      .catch(undefined),
    /** Only threads assigned to me. */
    mine: z
      .union([z.boolean(), z.enum(["true"]).transform(() => true)])
      .optional()
      .catch(undefined),
    from: day,
    to: day,
  });

export type ContactSearch = z.infer<typeof contactSearchSchema>;
