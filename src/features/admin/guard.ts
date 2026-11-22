import { redirect } from "@tanstack/react-router";
import { can, isOwner, type Me } from "@/lib/api/me";

/** Route guard: UX only (the API enforces it). Sends users without the permission home. */
export function requirePermission(me: Me | null, permission: string) {
  if (!can(me, permission)) throw redirect({ to: "/admin" });
}

/** Route guard for an Owner-only screen that is not a permission (Raporlar). UX only. */
export function requireOwner(me: Me | null) {
  if (!isOwner(me)) throw redirect({ to: "/admin" });
}
