/** Only same-site paths are valid post-login targets: never `//host` or a full URL. */
export function safeRedirect(value: string | undefined, fallback = "/hesap"): string {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    [...value].some((c) => c.charCodeAt(0) <= 32)
  )
    return fallback;
  return value;
}
