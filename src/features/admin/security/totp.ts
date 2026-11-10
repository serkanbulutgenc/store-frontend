import { ApiError } from "@/lib/api/errors";
import { type AllauthBody, call, toApiError } from "../auth/allauth";

export type TotpStatus = { active: true } | { active: false; secret: string };

const PATH = "account/authenticators/totp";

/** allauth answers 200 when an authenticator exists, and 404 carrying a fresh secret when not. */
export function parseTotpStatus(status: number, body: unknown): TotpStatus {
  if (status === 200) return { active: true };
  const secret = (body as { meta?: { secret?: string } } | null)?.meta?.secret;
  if (status === 404 && secret) return { active: false, secret };
  throw toApiError(status, body);
}

export async function fetchTotpStatus(): Promise<TotpStatus> {
  const res = await fetch(`/api/auth/${PATH}`, { headers: { accept: "application/json" } });
  return parseTotpStatus(res.status, await res.json().catch(() => null));
}

export async function activateTotp(code: string): Promise<void> {
  const { status, body } = await call(PATH, { code });
  if (status === 200) return;
  // Re-authentication is required before changing 2FA; say so rather than a generic failure.
  const flows = (body as AllauthBody | null)?.data?.flows ?? [];
  if (status === 401 && flows.some((f) => f.id === "reauthenticate"))
    throw new ApiError(401, "reauthentication_required", "Güvenlik için yeniden giriş yapın.", {});
  throw toApiError(status, body);
}

/** The URI authenticator apps import (typed in by hand as the secret when no QR is shown). */
export function otpauthUrl(secret: string, email: string, issuer = "Mağaza Yönetimi"): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}
