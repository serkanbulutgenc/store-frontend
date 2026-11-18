import {
  closestCenter,
  DndContext,
  type DragEndEvent,
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
import { zoneCoordinates } from "../catalog/components/category-drag";
import { type DropKind, type ItemPath, itemAt, type MenuItemRow, type MoveResult } from "./tree";

const ZONE_KINDS = ["before", "inside", "after"] as const;
const key = (path: ItemPath) => path.join(".");
const parsePath = (raw: string): ItemPath => raw.split(".").map(Number);
const zoneId = (kind: DropKind, path: ItemPath) => `${kind}:${key(path)}`;

function parseZone(raw: unknown): { kind: DropKind; path: ItemPath } | null {
  const [kind, path] = String(raw).split(":");
  return ZONE_KINDS.includes(kind as DropKind) && path
    ? { kind: kind as DropKind, path: parsePath(path) }
    : null;
}

type DragState = {
  active: ItemPath | null;
  /** What a drop at this place would do; `ok: false` says why it is refused. */
  plan: (kind: DropKind, path: ItemPath) => MoveResult | null;
};
const DragContext = createContext<DragState>({ active: null, plan: () => null });

const WHERE: Record<DropKind, string> = { before: "öncesine", inside: "içine", after: "sonrasına" };

/** Drag and drop for the Menu builder. It decides nothing itself: `planMove` says whether a drop
 * is allowed, and a refused one is reported through `onRefused` so the Owner sees why. */
export function MenuDnd({
  items,
  planMove,
  onMove,
  onRefused,
  children,
}: {
  items: MenuItemRow[];
  planMove: (from: ItemPath, kind: DropKind, path: ItemPath) => MoveResult;
  onMove: (items: MenuItemRow[]) => void;
  onRefused: (result: Extract<MoveResult, { ok: false }>) => void;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<ItemPath | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: zoneCoordinates }),
  );
  const name = (id: unknown) => {
    const item = itemAt(items, parsePath(String(id)));
    return item ? item.label || item.target_label : "";
  };
  const plan = (kind: DropKind, path: ItemPath) => (active ? planMove(active, kind, path) : null);
  const end = (e: DragEndEvent) => {
    setActive(null);
    const target = e.over ? parseZone(e.over.id) : null;
    if (!target) return;
    const result = planMove(parsePath(String(e.active.id)), target.kind, target.path);
    if (result.ok) onMove(result.items);
    else if (result.reason !== "self") onRefused(result);
  };
  const where = (over: { id: unknown } | null) => {
    const t = over ? parseZone(over.id) : null;
    return t ? `${name(key(t.path))} ${WHERE[t.kind]}` : "";
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) =>
        args.pointerCoordinates ? pointerWithin(args) : closestCenter(args)
      }
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={(e) => setActive(parsePath(String(e.active.id)))}
      onDragEnd={end}
      onDragCancel={() => setActive(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Öğeyi tutmak için Boşluk veya Enter'a basın. Yukarı ve aşağı oklarla konumu seçin, bırakmak için tekrar Boşluk veya Enter, vazgeçmek için Escape'e basın.",
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
      <DragContext.Provider value={{ active, plan }}>{children}</DragContext.Provider>
    </DndContext>
  );
}

/** The grip an item is picked up by, with the mouse or from the keyboard. */
export function DragHandle({ path, name }: { path: ItemPath; name: string }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: key(path) });
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

const ZONE_STYLE: Record<DropKind, string> = {
  before: "top-0 h-1/4",
  inside: "top-1/4 h-1/2",
  after: "bottom-0 h-1/4",
};

/** The three places a drop can land on a row. A place the item cannot go still takes the drop so
 * the refusal can be shown: it lights up red while hovered. Dropping on itself does nothing. */
export function RowDropZones({ path }: { path: ItemPath }) {
  return (
    <>
      {ZONE_KINDS.map((kind) => (
        <Zone key={kind} kind={kind} path={path} />
      ))}
    </>
  );
}

function Zone({ kind, path }: { kind: DropKind; path: ItemPath }) {
  const { active, plan } = useContext(DragContext);
  const result = plan(kind, path);
  const self = result !== null && !result.ok && result.reason === "self";
  const { setNodeRef, isOver } = useDroppable({
    id: zoneId(kind, path),
    disabled: active === null || self,
  });
  const refused = result !== null && !result.ok;
  return (
    <div
      ref={setNodeRef}
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 ${ZONE_STYLE[kind]} ${
        !isOver
          ? ""
          : refused
            ? "bg-red-500/15 ring-2 ring-red-500"
            : kind === "inside"
              ? "bg-primary/15 ring-2 ring-primary"
              : kind === "before"
                ? "border-t-4 border-primary"
                : "border-b-4 border-primary"
      }`}
    />
  );
}
