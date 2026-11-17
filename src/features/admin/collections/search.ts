import { z } from "zod";
import { COLLECTION_STATUSES } from "./rules";

/** URL search params of the Collections list. A status the API would refuse falls back to "all". */
export const collectionSearchSchema = z.object({
  status: z.enum(COLLECTION_STATUSES).optional().catch(undefined),
});

export type CollectionSearch = z.infer<typeof collectionSearchSchema>;
