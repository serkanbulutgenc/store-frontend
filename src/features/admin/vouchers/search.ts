import { z } from "zod";
import { VOUCHER_STATUSES } from "./rules";

/** URL search params of the vouchers list. A status the API would refuse (it answers 422)
 * falls back to "all" instead of being passed on. */
export const voucherSearchSchema = z.object({
  status: z
    .enum(VOUCHER_STATUSES as [string, ...string[]])
    .optional()
    .catch(undefined),
});

export type VoucherSearch = z.infer<typeof voucherSearchSchema>;
