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
