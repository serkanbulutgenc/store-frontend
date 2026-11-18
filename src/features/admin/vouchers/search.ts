import { z } from "zod";
import { listSearchSchema } from "../data-table/search";
import { VOUCHER_STATUSES } from "./rules";

/** URL search params of the vouchers list: the shared page and size, and a status. A status the API would refuse (it answers 422)
 * falls back to "all" instead of being passed on. */
export const voucherSearchSchema = listSearchSchema.pick({ page: true, size: true }).extend({
  status: z
    .enum(VOUCHER_STATUSES as [string, ...string[]])
    .optional()
    .catch(undefined),
});

export type VoucherSearch = z.infer<typeof voucherSearchSchema>;
