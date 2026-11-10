const DAY = 86_400_000;
export const MAX_DAYS = 366;

/** Mirrors the API's rules (inclusive range, at most 366 days). Returns an error message or null. */
export function validateRange(from: string, to: string): string | null {
  if (!from || !to) return "Başlangıç ve bitiş tarihini seçin.";
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return "Geçerli bir tarih girin.";
  if (b < a) return "Bitiş tarihi başlangıçtan önce olamaz.";
  if ((b - a) / DAY + 1 > MAX_DAYS) return `En fazla ${MAX_DAYS} günlük aralık seçilebilir.`;
  return null;
}
