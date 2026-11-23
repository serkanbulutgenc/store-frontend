/** Shape of `GET /api/admin/me` (MeOut in openapi-admin.json). */
export type Me = {
  id: number;
  email: string;
  name: string;
  role: "owner" | "staff" | null;
  permissions: string[];
  mfa_required: boolean;
  mfa_enrolled: boolean;
};

/** UI-only check; the API enforces every permission. `null` means signed out. */
export function can(me: Me | null | undefined, permission: string): boolean {
  return !!me?.permissions.includes(permission);
}

/**
 * UI-only check for the Owner role itself, for screens that are not a grantable
 * permission (Raporlar). An Owner who has not enrolled 2FA is refused by the API
 * everywhere but Security, so they do not count here.
 */
export function isOwner(me: Me | null | undefined): boolean {
  return me?.role === "owner" && !(me.mfa_required && !me.mfa_enrolled);
}
