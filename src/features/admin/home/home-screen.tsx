import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Me } from "@/lib/api/me";
import { homeQuery } from "../returns/queries";
import { dropWidget, editOrder, moveWidget, setFolded, setWidget } from "./layout";
import { useResetHomeLayout, useSaveHomeLayout } from "./queries";
import { SortableWidget } from "./widget-chrome";
import { WIDGETS } from "./widgets";

/** Ana sayfa: Widgets the person arranged (or their role's default), each a card with a way to act
 * on it or open its own screen. Cards fold to their header, can be dismissed, and are moved by
 * dragging; all of it is remembered for the person. */
export function HomeScreen({ me }: { me: Me | null }) {
  const { data } = useSuspenseQuery(homeQuery());
  const save = useSaveHomeLayout();
  const [editing, setEditing] = useState(false);
  const known = (k: string) => k in WIDGETS;
  const layout = data.layout.filter(known);
  const collapsed = data.collapsed;
  const label = (id: unknown) => WIDGETS[String(id)]?.label ?? "";
  const position = (id: unknown) => layout.indexOf(String(id)) + 1;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;
    const next = dropWidget(layout, String(active.id), String(over.id));
    if (next !== layout) save.mutate({ widgets: next });
  }
  function dismiss(key: string) {
    const before = { widgets: layout, collapsed };
    save.mutate({ widgets: setWidget(layout, key, false) });
    toast(`${label(key)} kaldırıldı.`, {
      description: "“Düzenle” ile yeniden ekleyebilirsiniz.",
      action: { label: "Geri al", onClick: () => save.mutate(before) },
    });
  }

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={{
            screenReaderInstructions: {
              draggable:
                "Kartı tutmak için Boşluk veya Enter'a basın. Okla taşıyın, bırakmak için tekrar Boşluk veya Enter, vazgeçmek için Escape'e basın.",
            },
            announcements: {
              onDragStart: ({ active }) => `${label(active.id)} tutuldu.`,
              onDragOver: ({ active, over }) =>
                over ? `${label(active.id)}, ${position(over.id)}. sıraya taşınacak.` : "",
              onDragEnd: ({ active, over }) =>
                over
                  ? `${label(active.id)}, ${position(over.id)}. sıraya bırakıldı.`
                  : `${label(active.id)} bırakılmadı.`,
              onDragCancel: ({ active }) => `${label(active.id)} için taşıma iptal edildi.`,
            },
          }}
        >
          <SortableContext items={layout} strategy={rectSortingStrategy}>
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {layout.map((key) => {
                const def = WIDGETS[key];
                if (!def) return null;
                return (
                  <SortableWidget
                    key={key}
                    id={key}
                    chrome={{
                      label: def.label,
                      icon: def.icon,
                      collapsed: collapsed.includes(key),
                      onToggle: () =>
                        save.mutate({
                          widgets: layout,
                          collapsed: setFolded(collapsed, key, !collapsed.includes(key)),
                        }),
                      onDismiss: () => dismiss(key),
                    }}
                  >
                    {def.render(data, me)}
                  </SortableWidget>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
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
                  onChange={(e) =>
                    save.mutate({ widgets: setWidget(layout, key, e.target.checked) })
                  }
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
                    onClick={() => save.mutate({ widgets: moveWidget(layout, key, -1) })}
                  >
                    <ArrowUp aria-hidden className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${label}: aşağı taşı`}
                    disabled={busy || layout[layout.length - 1] === key}
                    onClick={() => save.mutate({ widgets: moveWidget(layout, key, 1) })}
                  >
                    <ArrowDown aria-hidden className="size-4" />
                  </Button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => reset.mutate(undefined)}>
        Varsayılana dön
      </Button>
    </section>
  );
}
