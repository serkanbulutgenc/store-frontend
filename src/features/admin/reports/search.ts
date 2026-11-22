import { z } from "zod";

/** The reports the screen has. */
/** The ranges the API names itself. */
export const PRESETS = ["today", "7d", "30d", "this_month", "last_month"] as const;

export const REPORTS = ["sales", "products", "returns", "campaigns-vouchers"] as const;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

/** A calendar day as UTC milliseconds, or null for text that is not a real YYYY-MM-DD day (2026-02-30 is not). */
function dayMs(value: unknown): number | null {
  if (typeof value !== "string" || !DAY.test(value)) return null;
  const ms = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== value ? null : ms;
}

/** URL search params of the Reports screen. Anything the API would refuse (it answers 422) falls back to its default
 * instead of being passed on. */
export const reportSearchSchema = z
  .object({
    report: z.enum(REPORTS).catch("sales"),
    preset: z.enum(PRESETS).catch("30d"),
    /** Prices with KDV, or without. */
    kdv: z.enum(["incl", "excl"]).catch("incl"),
    /** Sales rows per day, week (from Monday) or month. */
    group: z.enum(["day", "week", "month"]).catch("day"),
    /** Products ranking. */
    sort: z.enum(["revenue", "units"]).catch("revenue"),
    date_from: z.unknown().optional(),
    date_to: z.unknown().optional(),
  })
  .transform(({ date_from, date_to, ...rest }) => {
    const from = dayMs(date_from);
    const to = dayMs(date_to);
    const span = from === null || to === null ? null : (to - from) / 86_400_000 + 1;
    // A custom range needs both ends, in order, within the API's limit: otherwise it is dropped whole.
    return span !== null && span >= 1 && span <= MAX_RANGE_DAYS
      ? { ...rest, date_from: date_from as string, date_to: date_to as string }
      : { ...rest, date_from: undefined, date_to: undefined };
  });

export type ReportSearch = z.infer<typeof reportSearchSchema>;
