import { ChevronDown, GripVertical, X } from "lucide-react";
import { type ReactNode, useId } from "react";
import { useWidgetChrome } from "./widget-chrome";

/** How many rows a Widget shows; the full list is one click away on the area's own screen. */
export const PREVIEW_ROWS = 5;

const ICON_BUTTON =
  "inline-flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring";

/** The frame every Widget shares: a header with its icon, title and (when it counts something) the
 * count, a handle to drag it, and buttons to fold or dismiss it; then its body. A folded card keeps
 * only the header. */
export function WidgetCard({
  id,
  title,
  count,
  empty,
  seeAll,
  children,
}: {
  id: string;
  title: string;
  /** How many are waiting. Leave it out for a Widget that does not count (a summary). */
  count?: number;
  /** What to say when nothing is waiting; needs `count`. */
  empty?: string;
  /** The link to the area's own screen, shown while something waits. */
  seeAll?: ReactNode;
  children: ReactNode;
}) {
  const chrome = useWidgetChrome();
  const bodyId = useId();
  const folded = chrome?.collapsed ?? false;
  const Icon = chrome?.icon;
  const nothing = count === 0;
  return (
    <section aria-labelledby={id} className="space-y-2 rounded-md border border-border bg-card p-4">
      <header className="flex items-center gap-1">
        {chrome && (
          <button
            type="button"
            ref={chrome.handle.ref}
            {...chrome.handle.props}
            aria-label={`${chrome.label}: sürükle`}
            className={`${ICON_BUTTON} cursor-grab touch-none`}
          >
            <GripVertical aria-hidden className="size-4" />
          </button>
        )}
        {Icon && <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />}
        <h2 id={id} className="min-w-0 flex-1 truncate font-semibold">
          {count === undefined ? title : `${title} (${count})`}
        </h2>
        {chrome && (
          <>
            <button
              type="button"
              aria-expanded={!folded}
              aria-controls={bodyId}
              aria-label={`${chrome.label}: ${folded ? "aç" : "daralt"}`}
              onClick={chrome.onToggle}
              className={ICON_BUTTON}
            >
              <ChevronDown
                aria-hidden
                className={`size-4 transition-transform ${folded ? "-rotate-90" : ""}`}
              />
            </button>
            <button
              type="button"
              aria-label={`${chrome.label}: kaldır`}
              onClick={chrome.onDismiss}
              className={ICON_BUTTON}
            >
              <X aria-hidden className="size-4" />
            </button>
          </>
        )}
      </header>
      <div id={bodyId} hidden={folded} className="space-y-2">
        {nothing && empty ? <p className="text-muted-foreground">{empty}</p> : children}
        {!nothing && seeAll}
      </div>
    </section>
  );
}
