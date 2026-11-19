import { formatDate, formatPercent } from "@/lib/format";

const STATUS: Record<string, string> = {
  active: "Aktif",
  scheduled: "Planlandı",
  ended: "Sona erdi",
  inactive: "Kapalı",
};

/** The statuses the Campaigns API can filter by. */
export const CAMPAIGN_STATUSES = Object.keys(STATUS);
export const campaignStatusLabel = (s: string) => STATUS[s] ?? s;

export function campaignStatusTone(s: string): "neutral" | "good" | "warn" {
  if (s === "active") return "good";
  if (s === "ended") return "warn";
  return "neutral";
}

export type CampaignToggle = {
  action: "activate" | "deactivate";
  label: string;
  success: string;
};

/** The one switch a row offers: "Aç" for a closed Campaign, "Kapat" for any other. An ended or
 * scheduled Campaign can still be closed, so the schedule cannot bring it back by itself. */
export function campaignToggle(status: string): CampaignToggle {
  return status === "inactive"
    ? { action: "activate", label: "Aç", success: "Kampanya açıldı." }
    : { action: "deactivate", label: "Kapat", success: "Kampanya kapatıldı." };
}

/** "%20", or "%12,5" for a fraction: the API sends "20.00" and "12.50". */
export const percentageText = (value: string) => `%${formatPercent(value)}`;

/** When the Campaign runs, in shop time: "Süresiz", or each end with "Hemen" / "Süresiz" for an open one. */
export function scheduleText(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt && !endsAt) return "Süresiz";
  return `${startsAt ? formatDate(startsAt) : "Hemen"} – ${endsAt ? formatDate(endsAt) : "Süresiz"}`;
}
