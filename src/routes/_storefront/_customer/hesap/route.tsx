import { createFileRoute } from "@tanstack/react-router";
import { AccountShell } from "@/features/account/components/account-shell";

export const Route = createFileRoute("/_storefront/_customer/hesap")({
  component: AccountShell,
});
