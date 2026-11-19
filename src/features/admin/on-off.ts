/**
 * What the Voucher and Campaign lists share: both rows have a status and an on/off switch with
 * its own activate and deactivate endpoints. Each feature supplies its own statuses and wording.
 */
export type Tone = "neutral" | "good" | "warn";

export type OnOffToggle = {
  action: "activate" | "deactivate";
  label: string;
  success: string;
};

/** The one switch a row offers: "Aç" for a closed row, "Kapat" for any other. A scheduled,
 * lapsed or used-up row can still be closed, so it does not come back by itself. */
export function onOffToggle(
  status: string,
  success: { opened: string; closed: string },
): OnOffToggle {
  return status === "inactive"
    ? { action: "activate", label: "Aç", success: success.opened }
    : { action: "deactivate", label: "Kapat", success: success.closed };
}

/** The label of a status; one the screen does not know is shown as it is, not hidden. */
export const statusLabel = (labels: Record<string, string>, status: string): string =>
  labels[status] ?? status;

/** Good while running, a warning for the given lapsed statuses, neutral for the rest. */
export function statusTone(status: string, warn: readonly string[]): Tone {
  if (status === "active") return "good";
  return warn.includes(status) ? "warn" : "neutral";
}
