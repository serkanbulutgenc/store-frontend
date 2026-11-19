import { z } from "zod";
import { listSearchSchema } from "../data-table/search";
import { CAMPAIGN_STATUSES } from "./rules";

/** URL search params of the Campaigns list: the shared page and size, and a status, and the Campaign to open. A status the
 * API would refuse (it answers 422) falls back to "all" instead of being passed on. */
export const campaignSearchSchema = listSearchSchema.pick({ page: true, size: true }).extend({
  status: z
    .enum(CAMPAIGN_STATUSES as [string, ...string[]])
    .optional()
    .catch(undefined),
  /** A Campaign to open for editing, as an Order's link asks. Anything else is ignored. */
  edit: z.coerce.number().int().positive().optional().catch(undefined),
});

export type CampaignSearch = z.infer<typeof campaignSearchSchema>;
