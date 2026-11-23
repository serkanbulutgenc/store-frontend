import { z } from "zod";
import { SLOT_KEYS, STATUSES } from "./rules";

/** URL search params of the Banner list. A value the API would refuse falls back to "all". */
export const bannerSearchSchema = z.object({
  status: z.enum(STATUSES).optional().catch(undefined),
  slot: z.enum(SLOT_KEYS).optional().catch(undefined),
});

export type BannerSearch = z.infer<typeof bannerSearchSchema>;
