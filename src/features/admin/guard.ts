import { redirect } from "@tanstack/react-router";
import { can, type Me } from "@/lib/api/me";

/** Route guard: UX only (the API enforces it). Sends users without the permission home. */
export function requirePermission(me: Me | null, permission: string) {
  if (!can(me, permission)) throw redirect({ to: "/admin" });
}
