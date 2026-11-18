import { z } from "zod";
import { listSearchSchema } from "../data-table/search";
import { CAMPAIGN_STATUSES } from "./rules";

/** URL search params of the Campaigns list: the shared page and size, and a status. A status the
 * API would refuse (it answers 422) falls back to "all" instead of being passed on. */
export const campaignSearchSchema = listSearchSchema.pick({ page: true, size: true }).extend({
  status: z
    .enum(CAMPAIGN_STATUSES as [string, ...string[]])
    .optional()
    .catch(undefined),
});

export type CampaignSearch = z.infer<typeof campaignSearchSchema>;
