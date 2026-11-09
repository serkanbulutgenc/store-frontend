import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: () => (
    <div data-theme="admin" className="min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  ),
});
