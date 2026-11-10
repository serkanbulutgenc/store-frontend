const COMMON = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com", "yandex.com"];

/** Real providers that happen to sit one letter from a common one. */
const REAL = ["mail.com", "gmx.com", "aol.com", "msn.com", "live.com", "ymail.com"];

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0] as number;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j] as number;
      row[j] = Math.min(
        (row[j] as number) + 1,
        (row[j - 1] as number) + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return row[b.length] as number;
}

/** True when `a` is `b` with two neighbouring letters swapped ("gmial" for "gmail"). */
function isSwap(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const diff = [...a].flatMap((c, i) => (c === b[i] ? [] : [i]));
  const [i, j] = diff;
  return (
    diff.length === 2 &&
    j === (i as number) + 1 &&
    a[i as number] === b[j as number] &&
    a[j as number] === b[i as number]
  );
}

/** A corrected address when the domain is one typo away from a common provider, else null. */
export function suggestEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase();
  if (!domain || COMMON.includes(domain) || REAL.includes(domain)) return null;
  const match = COMMON.find((d) => distance(domain, d) === 1 || isSwap(domain, d));
  return match ? `${email.slice(0, at)}@${match}` : null;
}
