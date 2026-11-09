import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_storefront/")({
  component: () => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Aura Tekstil</h1>
      <p className="mt-2 text-muted-foreground">Mağaza yakında burada.</p>
      <Button className="mt-4">Alışverişe başla</Button>
    </main>
  ),
});
