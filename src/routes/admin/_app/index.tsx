import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_app/")({
  component: () => (
    <section>
      <h1 className="text-lg font-semibold">Ana sayfa</h1>
      <p className="text-muted-foreground">Bugünün işleri burada görünecek.</p>
    </section>
  ),
});
