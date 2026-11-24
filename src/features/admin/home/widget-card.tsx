import type { ReactNode } from "react";

/** How many rows a Widget shows; the full list is one click away on the area's own screen. */
export const PREVIEW_ROWS = 5;

/** The frame every Widget shares: a title with the count, its rows, and a way to the full list. */
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
  count: number;
  /** What to say when nothing is waiting. */
  empty: string;
  /** The link to the area's own screen; shown with the count when there is more than a preview. */
  seeAll: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-2 rounded-md border border-border bg-card p-4">
      <h2 id={id} className="font-semibold">
        {title} ({count})
      </h2>
      {count === 0 ? <p className="text-muted-foreground">{empty}</p> : children}
      {count > 0 && seeAll}
    </section>
  );
}
