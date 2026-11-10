import { ApiError } from "@/lib/api/errors";

export type AllauthBody = {
  status?: number;
  data?: { flows?: { id: string; is_pending?: boolean }[] };
  errors?: { message: string; code: string; param?: string }[];
};

export type Step = "done" | "mfa";

/** allauth answers an email+password login for an enrolled account with a pending 2FA flow (401). */
export function nextStep(status: number, body: unknown): Step | null {
  if (status === 200) return "done";
  const flows = (body as AllauthBody | null)?.data?.flows ?? [];
  if (status === 401 && flows.some((f) => f.id === "mfa_authenticate" && f.is_pending))
    return "mfa";
  return null;
}

export function toApiError(status: number, body: unknown): ApiError {
  const errors = (body as AllauthBody | null)?.errors ?? [];
  const first = errors[0];
  const fields: Record<string, string[]> = {};
  for (const e of errors) {
    if (e.param) fields[e.param] = [...(fields[e.param] ?? []), e.message];
  }
  return new ApiError(
    status,
    first?.code ?? "error",
    first?.message ?? "İstek işlenemedi.",
    fields,
  );
}

export async function call(
  path: string,
  payload: object,
  method = "POST",
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`/api/auth/${path}`, {
    method,
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

/** Step 1. Returns the next step; throws ApiError on bad credentials. */
export async function login(email: string, password: string): Promise<Step> {
  const { status, body } = await call("auth/login", { email, password });
  const step = nextStep(status, body);
  if (!step) throw toApiError(status, body);
  return step;
}

/** Step 2: the TOTP code. */
export async function authenticateTotp(code: string): Promise<void> {
  const { status, body } = await call("auth/2fa/authenticate", { code });
  if (nextStep(status, body) !== "done") throw toApiError(status, body);
}

/** Ends the session. allauth answers 401 for "no longer authenticated"; the proxy clears the cookie. */
export async function logout(): Promise<void> {
  await fetch("/api/auth/auth/session", {
    method: "DELETE",
    headers: { accept: "application/json" },
  });
}
