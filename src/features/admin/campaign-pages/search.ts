import { z } from "zod";
import { PAGE_STATUSES } from "./rules";

/** URL search params of the Campaign pages list. A status the API would refuse falls back to "all". */
export const pageSearchSchema = z.object({
  status: z.enum(PAGE_STATUSES).optional().catch(undefined),
});

export type PageSearch = z.infer<typeof pageSearchSchema>;
