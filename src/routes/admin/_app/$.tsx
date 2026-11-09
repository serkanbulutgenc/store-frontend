import { createFileRoute } from "@tanstack/react-router";
import { NotFoundState } from "@/components/route-states";

/** Unknown /admin/* paths render here, as a child of the shell, so the sidebar stays. */
export const Route = createFileRoute("/admin/_app/$")({
  component: () => <NotFoundState home="/admin" />,
});
