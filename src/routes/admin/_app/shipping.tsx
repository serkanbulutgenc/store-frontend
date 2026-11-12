import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/features/admin/guard";
import { shippingQuery } from "@/features/admin/shipping/queries";
import { ShippingScreen } from "@/features/admin/shipping/shipping-screen";

export const Route = createFileRoute("/admin/_app/shipping")({
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_settings"),
  loader: ({ context }) => context.queryClient.query(shippingQuery),
  component: ShippingScreen,
});
