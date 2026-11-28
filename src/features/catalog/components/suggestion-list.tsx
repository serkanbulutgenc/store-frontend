import type { ComponentProps, MouseEvent } from "react";
import { cn } from "@/lib/utils";
import type { SuggestionGroup } from "../queries";

type Type = SuggestionGroup["type"];

const LABELS: Record<Type, { heading: string; singular: string }> = {
  category: { heading: "Kategoriler", singular: "Kategori" },
  brand: { heading: "Markalar", singular: "Marka" },
  collection: { heading: "Koleksiyonlar", singular: "Koleksiyon" },
  campaign_page: { heading: "Kampanya sayfaları", singular: "Kampanya sayfası" },
  product: { heading: "Ürünler", singular: "Ürün" },
};

export type SuggestionRow = SuggestionGroup["items"][number] & { type: Type };

export const optionId = (listId: string, index: number) => `${listId}-option-${index}`;

/**
 * The rows of the Search suggestions panel: each suggestion under its type's heading, then
 * "all results". A row's number is its place in `suggestions`, with "all results" after the
 * last; `active` is the highlighted number, or -1.
 */
export function SuggestionList({
  id,
  suggestions,
  allResultsHref,
  active,
  onChoose,
}: {
  id: string;
  suggestions: SuggestionRow[];
  allResultsHref: string;
  active: number;
  onChoose: (index: number) => void;
}) {
  const row = (index: number, href: string) => ({
    id: optionId(id, index),
    href,
    active: index === active,
    onClick: (e: MouseEvent) => {
      // A modified click opens the page in a new tab, as any link does.
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      onChoose(index);
    },
  });
  const types = [...new Set(suggestions.map((s) => s.type))];
  return (
    <div id={id} role="listbox" aria-label="Öneriler">
      {types.map((type) => (
        // biome-ignore lint/a11y/useSemanticElements: a fieldset is not allowed inside a listbox
        <div key={type} role="group" aria-labelledby={`${id}-${type}`}>
          <div
            id={`${id}-${type}`}
            role="presentation"
            className="px-3 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase"
          >
            {LABELS[type].heading}
          </div>
          {suggestions.map(
            (item, index) =>
              item.type === type && (
                <Option key={item.path} {...row(index, item.path)}>
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="h-12 w-9 rounded-sm object-cover" />
                  ) : (
                    <span
                      data-placeholder
                      aria-hidden="true"
                      className="h-12 w-9 rounded-sm bg-muted"
                    />
                  )}
                  <span>
                    {item.name}
                    <span className="sr-only">, {LABELS[type].singular}</span>
                  </span>
                </Option>
              ),
          )}
        </div>
      ))}
      <Option {...row(suggestions.length, allResultsHref)} className="border-t font-semibold">
        Tüm sonuçları gör
      </Option>
    </div>
  );
}

/** Focus stays in the search box, so rows are not tab stops. */
function Option({ active, className, ...props }: ComponentProps<"a"> & { active: boolean }) {
  return (
    <a
      role="option"
      tabIndex={-1}
      aria-selected={active}
      className={cn(
        "flex items-center gap-3 px-3 py-2 hover:bg-muted",
        active && "bg-muted",
        className,
      )}
      {...props}
    />
  );
}
