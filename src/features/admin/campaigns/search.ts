import { z } from "zod";
import { PAGE_STATUSES } from "../campaign-pages/rules";
import { listSearchSchema } from "../data-table/search";
import { CAMPAIGN_STATUSES } from "./rules";

/** URL search params of the Campaigns list: the shared page and size, and a status, and the Campaign to open. A status the
 * API would refuse (it answers 422) falls back to "all" instead of being passed on. */
export const campaignSearchSchema = listSearchSchema.pick({ page: true, size: true }).extend({
  status: z
    .enum(CAMPAIGN_STATUSES as [string, ...string[]])
    .optional()
    .catch(undefined),
  /** Which list the screen shows; absent means the first one the user may see. */
  tab: z.enum(["campaigns", "pages", "basket"]).optional().catch(undefined),
  /** The Sepet kampanyaları tab's status filter. */
  bstatus: z
    .enum(CAMPAIGN_STATUSES as [string, ...string[]])
    .optional()
    .catch(undefined),
  /** The Campaign pages tab's status filter. */
  pstatus: z.enum(PAGE_STATUSES).optional().catch(undefined),
  /** An old link's Campaign to open; it now redirects to the Campaign's own page. */
  edit: z.coerce.number().int().positive().optional().catch(undefined),
});

export type CampaignSearch = z.infer<typeof campaignSearchSchema>;
