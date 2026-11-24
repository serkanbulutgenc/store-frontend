import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Me } from "@/lib/api/me";
import { homeQuery } from "../returns/queries";
import { editOrder, moveWidget, setWidget } from "./layout";
import { useResetHomeLayout, useSaveHomeLayout } from "./queries";
import { WIDGETS } from "./widgets";

/** Ana sayfa: Widgets the person arranged (or their role's default), each a summary with a
 * way to act on it or open its own screen. */
export function HomeScreen({ me }: { me: Me | null }) {
  const { data } = useSuspenseQuery(homeQuery());
  const [editing, setEditing] = useState(false);
  const known = (k: string) => k in WIDGETS;
  const layout = data.layout.filter(known);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Ana sayfa</h1>
        <Button variant="outline" size="sm" onClick={() => setEditing((e) => !e)}>
          {editing ? "Bitti" : "Düzenle"}
        </Button>
      </div>
      {editing && <LayoutEditor layout={layout} available={data.available.filter(known)} />}
      {layout.length === 0 ? (
        <p className="text-muted-foreground">
          Ana sayfada gösterilen bir bileşen yok. “Düzenle” ile ekleyebilirsiniz.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {layout.map((key) => (
            <div key={key}>{WIDGETS[key]?.render(data, me)}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function LayoutEditor({ layout, available }: { layout: string[]; available: string[] }) {
  const save = useSaveHomeLayout();
  const reset = useResetHomeLayout();
  const busy = save.isPending || reset.isPending;
  return (
    <section
      aria-label="Ana sayfayı düzenle"
      className="space-y-2 rounded-md border border-border bg-card p-4"
    >
      <ul className="divide-y divide-border">
        {editOrder(layout, available).map((key) => {
          const on = layout.includes(key);
          const label = WIDGETS[key]?.label ?? key;
          return (
            <li key={key} className="flex items-center justify-between gap-2 py-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={on}
                  disabled={busy}
                  onChange={(e) => save.mutate(setWidget(layout, key, e.target.checked))}
                />
                {label}
              </label>
              {on && (
                <span className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${label}: yukarı taşı`}
                    disabled={busy || layout[0] === key}
                    onClick={() => save.mutate(moveWidget(layout, key, -1))}
                  >
                    <ArrowUp aria-hidden className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${label}: aşağı taşı`}
                    disabled={busy || layout[layout.length - 1] === key}
                    onClick={() => save.mutate(moveWidget(layout, key, 1))}
                  >
                    <ArrowDown aria-hidden className="size-4" />
                  </Button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => reset.mutate()}>
        Varsayılana dön
      </Button>
    </section>
  );
}
