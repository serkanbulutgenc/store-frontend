import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { LucideIcon } from "lucide-react";
import { createContext, type ReactNode, useContext } from "react";

/** What a card's frame needs from the page: its icon and name, whether it is folded, what the
 * buttons do, and the handle that starts a drag. Provided around each Widget by `SortableWidget`;
 * a Widget drawn outside the page (a test) gets none and shows a plain card. */
export type WidgetChrome = {
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
  onToggle: () => void;
  onDismiss: () => void;
  handle: {
    ref: (el: HTMLElement | null) => void;
    props: Record<string, unknown>;
  };
};

const Chrome = createContext<WidgetChrome | null>(null);
export const useWidgetChrome = () => useContext(Chrome);

/** One draggable cell of the grid, holding a Widget and giving it its chrome. */
export function SortableWidget({
  id,
  chrome,
  children,
}: {
  id: string;
  chrome: Omit<WidgetChrome, "handle">;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "relative z-10 opacity-90 shadow-lg" : undefined}
    >
      <Chrome.Provider
        value={{
          ...chrome,
          handle: { ref: setActivatorNodeRef, props: { ...attributes, ...listeners } },
        }}
      >
        {children}
      </Chrome.Provider>
    </div>
  );
}
