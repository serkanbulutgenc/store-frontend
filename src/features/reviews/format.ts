/** "4,5" for the Turkish locale. */
export const formatAverage = (value: number) =>
  value.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  pending: "Onay bekliyor",
  published: "Yayında",
  rejected: "Reddedildi",
};
export const reviewStatusLabel = (s: string) => REVIEW_STATUS_LABELS[s] ?? s;
export const BODY_MAX = 2000;
