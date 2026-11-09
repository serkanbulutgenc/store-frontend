import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_storefront")({
  component: () => (
    <div data-theme="storefront" className="min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  ),
});
