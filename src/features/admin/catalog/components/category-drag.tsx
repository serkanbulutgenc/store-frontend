import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type KeyboardCoordinateGetter,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { createContext, useContext, useState } from "react";
import { type DropPlan, type DropTarget, planDrop } from "../category-order";
import type { CategoryOut } from "../queries";

const ZONE_KINDS = ["before", "inside", "after"] as const;
type ZoneKind = (typeof ZONE_KINDS)[number];

const zoneId = (kind: ZoneKind, id: number) => `${kind}:${id}`;

function parseZone(raw: unknown): DropTarget | null {
  const [kind, id] = String(raw).split(":");
  return ZONE_KINDS.includes(kind as ZoneKind) && id
    ? { kind: kind as ZoneKind, id: Number(id) }
    : null;
}

type DragState = {
  activeId: number | null;
  /** The plan for this drop, or null when it is not allowed. Staff may only reorder. */
  plan: (target: DropTarget) => DropPlan | null;
};
const DragContext = createContext<DragState>({ activeId: null, plan: () => null });

/** Up and down arrows step through the enabled drop zones, so a keyboard drag can reach
 * every valid position (before, inside, after) and skips the invalid ones. */
export const zoneCoordinates: KeyboardCoordinateGetter = (
  event,
  { context: { active, droppableRects, droppableContainers, over, collisionRect } },
) => {
  if (event.code !== "ArrowDown" && event.code !== "ArrowUp") return undefined;
  event.preventDefault();
  if (!active || !collisionRect) return undefined;
  const zones = droppableContainers
    .getEnabled()
    .flatMap((c) => {
      const rect = droppableRects.get(c.id);
      return rect ? [{ id: c.id, rect }] : [];
    })
    .sort((a, b) => a.rect.top - b.rect.top);
  const down = event.code === "ArrowDown";
  const middle = (z: { rect: { top: number; height: number } }) => z.rect.top + z.rect.height / 2;
  const held = collisionRect.top + collisionRect.height / 2;
  const at = zones.findIndex((z) => z.id === over?.id);
  // Before the first step there is no zone yet: start from the one nearest the held row.
  const next =
    at >= 0
      ? zones[down ? at + 1 : at - 1]
      : down
        ? zones.find((z) => middle(z) > held + 1)
        : [...zones].reverse().find((z) => middle(z) < held - 1);
  if (!next) return undefined;
  return {
    x: next.rect.left + next.rect.width / 2 - collisionRect.width / 2,
    y: next.rect.top + next.rect.height / 2 - collisionRect.height / 2,
  };
};

const WHERE: Record<ZoneKind, string> = {
  before: "öncesine",
  inside: "içine",
  after: "sonrasına",
};

/** Drag and drop for the Category tree. It only turns a drop into a `DropPlan`; the
 * caller sends the same move and reorder requests the buttons use. */
export function TreeDnd({
  categories,
  canRestructure,
  onDrop,
  children,
}: {
  categories: CategoryOut[];
  canRestructure: boolean;
  onDrop: (plan: DropPlan) => void;
  children: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: zoneCoordinates }),
  );
  const name = (id: unknown) => categories.find((c) => c.id === Number(id))?.name ?? "";
  const plan = (target: DropTarget) => {
    if (activeId === null) return null;
    const p = planDrop(categories, activeId, target);
    return p && (p.move === null || canRestructure) ? p : null;
  };
  const end = (e: DragEndEvent) => {
    setActiveId(null);
    const target = e.over ? parseZone(e.over.id) : null;
    const p = target && planDrop(categories, Number(e.active.id), target);
    if (p && (p.move === null || canRestructure)) onDrop(p);
  };
  const where = (over: { id: unknown } | null) => {
    const t = over ? parseZone(over.id) : null;
    return t ? `${name(t.id)} ${WHERE[t.kind]}` : "";
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) =>
        args.pointerCoordinates ? pointerWithin(args) : closestCenter(args)
      }
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={(e) => setActiveId(Number(e.active.id))}
      onDragEnd={end}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Kategoriyi tutmak için Boşluk veya Enter'a basın. Yukarı ve aşağı oklarla konumu seçin, bırakmak için tekrar Boşluk veya Enter, vazgeçmek için Escape'e basın.",
        },
        announcements: {
          onDragStart: ({ active }) => `${name(active.id)} tutuldu.`,
          onDragOver: ({ active, over }) =>
            over
              ? `${name(active.id)}, ${where(over)} taşınacak.`
              : `${name(active.id)} bırakılamaz.`,
          onDragEnd: ({ active, over }) =>
            over
              ? `${name(active.id)}, ${where(over)} bırakıldı.`
              : `${name(active.id)} bırakılmadı.`,
          onDragCancel: ({ active }) => `${name(active.id)} için taşıma iptal edildi.`,
        },
      }}
    >
      <DragContext.Provider value={{ activeId, plan }}>{children}</DragContext.Provider>
    </DndContext>
  );
}

/** The grip a Category is picked up by, with the mouse or from the keyboard. */
export function DragHandle({ id, name }: { id: number; name: string }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });
  return (
    <button
      type="button"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${name} sürükle`}
      className="size-6 shrink-0 cursor-grab touch-none rounded text-muted-foreground hover:bg-accent focus-visible:outline-2"
    >
      ⠿
    </button>
  );
}

const ZONE_STYLE: Record<ZoneKind, string> = {
  before: "top-0 h-1/4",
  inside: "top-1/4 h-1/2",
  after: "bottom-0 h-1/4",
};

/** Whether this row cannot take the dragged Category in any position. */
export function useRowBlocked(id: number): boolean {
  const { activeId, plan } = useContext(DragContext);
  return activeId !== null && !ZONE_KINDS.some((kind) => plan({ kind, id }) !== null);
}

/** The three places a drop can land on a row: before it, inside it, after it. Zones that
 * would be refused are disabled, so they neither highlight nor accept. */
export function RowDropZones({ id }: { id: number }) {
  return (
    <>
      {ZONE_KINDS.map((kind) => (
        <Zone key={kind} kind={kind} id={id} />
      ))}
    </>
  );
}

function Zone({ kind, id }: { kind: ZoneKind; id: number }) {
  const { activeId, plan } = useContext(DragContext);
  const allowed = activeId !== null && plan({ kind, id }) !== null;
  const { setNodeRef, isOver } = useDroppable({ id: zoneId(kind, id), disabled: !allowed });
  return (
    <div
      ref={setNodeRef}
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 ${ZONE_STYLE[kind]} ${
        isOver && allowed
          ? kind === "inside"
            ? "bg-primary/15 ring-2 ring-primary"
            : kind === "before"
              ? "border-t-4 border-primary"
              : "border-b-4 border-primary"
          : ""
      }`}
    />
  );
}
