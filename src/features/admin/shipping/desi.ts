const MAX_DESI = 1000;

/** Desi is a whole number from 1; a Product may leave it blank to use its class default. */
export function desiError(value: string, opts: { optional?: boolean } = {}): string | null {
  const v = value.trim();
  if (v === "") return opts.optional ? null : "Desi girin.";
  if (!/^\d+$/.test(v)) return "Tam sayı girin.";
  const n = Number(v);
  return n >= 1 && n <= MAX_DESI ? null : `Desi 1 ile ${MAX_DESI} arasında olmalı.`;
}
