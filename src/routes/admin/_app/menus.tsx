import { createFileRoute } from "@tanstack/react-router";
import { categoriesQuery } from "@/features/admin/catalog/queries";
import { requirePermission } from "@/features/admin/guard";
import { MenusScreen } from "@/features/admin/menus/menus-screen";
import { menuQuery } from "@/features/admin/menus/queries";

export const Route = createFileRoute("/admin/_app/menus")({
  beforeLoad: ({ context }) => requirePermission(context.me, "manage_menus"),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.query(menuQuery("header")),
      context.queryClient.query(menuQuery("footer")),
      context.queryClient.query(categoriesQuery),
    ]),
  component: MenusScreen,
});
