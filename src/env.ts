import { z } from "zod";

const schema = z.object({
  API_INTERNAL_URL: z.url(),
  SESSION_COOKIE_NAME: z.string().min(1),
  /** Django's CSRF cookie name; `__Secure-csrftoken` in production. */
  CSRF_COOKIE_NAME: z.string().min(1).default("csrftoken"),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${issues}`);
  }
  return result.data;
}

let cached: Env | undefined;

/** Server-only. Validated on first use; throws with a readable message if misconfigured. */
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
