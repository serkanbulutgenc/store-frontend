import { call, toApiError } from "@/features/admin/auth/allauth";

type Flow = { id: string; is_pending?: boolean };
type Body = { data?: { flows?: Flow[] } } | null;

export type AuthOutcome = "signed_in" | "verify_email";

/**
 * allauth answers 200 when a session exists and 401 with the pending flows when more is
 * needed. For a Customer the only flow is email verification; anything else (such as a
 * Staff account's 2FA step) is not a way into the storefront.
 */
export function outcome(status: number, body: unknown): AuthOutcome | null {
  if (status === 200) return "signed_in";
  const flows = (body as Body)?.data?.flows ?? [];
  if (status === 401 && flows.some((f) => f.id === "verify_email" && f.is_pending))
    return "verify_email";
  return null;
}

async function run(path: string, payload: object, method = "POST") {
  const { status, body } = await call(path, payload, method);
  return { status, body, outcome: outcome(status, body) };
}

/** Throws ApiError unless allauth accepted the request (200, or 401 with a pending flow). */
async function expectOutcome(path: string, payload: object): Promise<AuthOutcome> {
  const r = await run(path, payload);
  if (!r.outcome) throw toApiError(r.status, r.body);
  return r.outcome;
}

export const signUp = (email: string, password: string) =>
  expectOutcome("auth/signup", { email, password });

export const logIn = (email: string, password: string) =>
  expectOutcome("auth/login", { email, password });

/** A used or expired link is a 400; a verified link is a 200, or a 401 asking to log in. */
export async function verifyEmail(key: string): Promise<void> {
  const r = await run("auth/email/verify", { key });
  // 401 is allauth asking a not-yet-signed-in user to log in after a verified key.
  const flows = (r.body as Body)?.data?.flows;
  const ok = r.status === 200 || (r.status === 401 && Array.isArray(flows) && flows.length > 0);
  if (!ok) throw toApiError(r.status, r.body);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const r = await run("auth/password/request", { email });
  if (r.status !== 200) throw toApiError(r.status, r.body);
}

export async function resetPassword(key: string, password: string): Promise<void> {
  const r = await run("auth/password/reset", { key, password });
  if (r.status !== 200 && r.status !== 401) throw toApiError(r.status, r.body);
}

export async function changePassword(current: string, next: string): Promise<void> {
  const r = await run("account/password/change", {
    current_password: current,
    new_password: next,
  });
  if (r.status !== 200) throw toApiError(r.status, r.body);
}

/** Adds the new address as pending; it replaces the old one once verified. */
export async function requestEmailChange(email: string): Promise<void> {
  const r = await run("account/email", { email });
  if (r.status !== 200) throw toApiError(r.status, r.body);
}
