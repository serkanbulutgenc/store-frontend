import { formatDate, formatPercent } from "@/lib/format";
import { type OnOffToggle, onOffToggle, statusLabel, statusTone } from "../on-off";

const STATUS: Record<string, string> = {
  active: "Aktif",
  scheduled: "Planlandı",
  ended: "Sona erdi",
  inactive: "Kapalı",
};

/** The statuses the Campaigns API can filter by. */
export const CAMPAIGN_STATUSES = Object.keys(STATUS);
export const campaignStatusLabel = (s: string) => statusLabel(STATUS, s);
export const campaignStatusTone = (s: string) => statusTone(s, ["ended"]);

export type CampaignToggle = OnOffToggle;

/** The one switch a row offers; an ended or scheduled Campaign can still be closed, so the
 * schedule cannot bring it back by itself. */
export const campaignToggle = (status: string): CampaignToggle =>
  onOffToggle(status, { opened: "Kampanya açıldı.", closed: "Kampanya kapatıldı." });

/** "%20", or "%12,5" for a fraction: the API sends "20.00" and "12.50". */
export const percentageText = (value: string) => `%${formatPercent(value)}`;

/** When the Campaign runs, in shop time: "Süresiz", or each end with "Hemen" / "Süresiz" for an open one. */
export function scheduleText(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt && !endsAt) return "Süresiz";
  return `${startsAt ? formatDate(startsAt) : "Hemen"} – ${endsAt ? formatDate(endsAt) : "Süresiz"}`;
}
