import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounced } from "@/lib/use-debounced";
import { browseSearchSchema } from "../browse-search";
import { MIN_SUGGESTION_QUERY, type SuggestionGroup, suggestionsQuery } from "../queries";
import { optionId, SuggestionList, type SuggestionRow } from "./suggestion-list";

const LIST_ID = "site-suggestions";

/** The results page for `q`. Always navigate this way: a hand-built `?q=true` is not text. */
const results = (q: string) => ({ to: "/ara", search: { q } }) as const;

/**
 * What the box takes from the URL. `page` is left out: scrolling a listing changes it, which
 * must not disturb someone typing.
 */
function useSearchLocation() {
  const location = useRouterState({ select: (s) => s.location });
  const { page: _page, ...search } = location.search as Record<string, unknown>;
  return {
    key: JSON.stringify([location.pathname, search]),
    q: location.pathname === "/ara" ? (browseSearchSchema.shape.q.parse(search.q) ?? "") : null,
  };
}

/**
 * The suggestion groups to show for what is typed, or `null` for no panel. Only an open box
 * asks, so a prefilled one stays quiet until used.
 */
function useSuggestions(term: string, isOpen: boolean): SuggestionGroup[] | null {
  const settled = useDebounced(term, 200);
  const query = suggestionsQuery(settled);
  const { data, isPlaceholderData } = useQuery({ ...query, enabled: isOpen && query.enabled });
  if (!data || Math.min(term.length, settled.length) < MIN_SUGGESTION_QUERY) return null;
  // An empty answer to earlier text says nothing about this text.
  const current = settled === term && !isPlaceholderData;
  return data.length || current ? data : null;
}

/** The header search box, with Search suggestions under it. Submitting opens the results page. */
export function SearchBox() {
  const navigate = useNavigate();
  const router = useRouter();
  const location = useSearchLocation();
  const [q, setQ] = useState(location.q ?? "");
  const [isOpen, setOpen] = useState(false);
  // Belongs to the answer it was made on, so a new answer starts with none highlighted.
  const [highlight, setHighlight] = useState<{ answer: SuggestionGroup[]; row: number } | null>(
    null,
  );
  const box = useRef<HTMLElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const term = q.trim();
  const groups = useSuggestions(term, isOpen);

  // True between leaving the window with the input focused and coming back to it.
  const leftWindow = useRef(false);

  const close = useCallback(() => {
    setOpen(false);
    setHighlight(null);
  }, []);

  const [lastLocation, setLastLocation] = useState(location.key);
  if (lastLocation !== location.key) {
    setLastLocation(location.key);
    close();
    if (location.q !== null) setQ(location.q);
  }

  // Clicks on things that take no focus do not blur the input.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen, close]);

  const expanded = isOpen && groups !== null;
  // The rows in order. "All results" comes after them, as number `suggestions.length`.
  const suggestions: SuggestionRow[] = expanded
    ? groups.flatMap((g) => g.items.map((item) => ({ ...item, type: g.type })))
    : [];
  const rowCount = suggestions.length + 1;
  const active = expanded && highlight?.answer === groups ? highlight.row : -1;

  /** Closes and lets go of the input, which also puts a phone's keyboard away. */
  const closeAndBlur = () => {
    close();
    input.current?.blur();
  };
  const choose = (row: number) => {
    const suggestion = suggestions[row];
    closeAndBlur();
    if (suggestion) void navigate({ href: suggestion.path });
    else void navigate(results(term));
  };
  const submit = () => {
    if (!term) return;
    closeAndBlur();
    void navigate(results(term));
  };

  useEffect(() => {
    if (active === -1) return;
    document.getElementById(optionId(LIST_ID, active))?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    const arrow = e.key === "ArrowDown" || e.key === "ArrowUp";
    if (!expanded) {
      if (arrow) setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault(); // a search input would otherwise clear itself
      close();
    } else if (arrow) {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      const from = active === -1 && step === -1 ? 0 : active;
      setHighlight({ answer: groups, row: (from + step + rowCount) % rowCount });
    } else if (e.key === "Enter") {
      if (active === -1) return; // nothing highlighted: the form submits
      e.preventDefault();
      choose(active);
    }
  };

  return (
    <search
      ref={box}
      className="w-full"
      onBlur={(e) => {
        // Tabbing away. With no new target (a phone's keyboard closing) the panel stays.
        if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) close();
      }}
    >
      <form
        className="relative flex w-full"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="site-search" className="sr-only">
          Ürün ara
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            ref={input}
            id="site-search"
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={expanded ? LIST_ID : undefined}
            aria-activedescendant={active === -1 ? undefined : optionId(LIST_ID, active)}
            autoComplete="off"
            placeholder="Elbise, ayakkabı, çanta ara"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setHighlight(null); // Enter now means the new text
            }}
            onFocus={() => {
              if (!leftWindow.current) setOpen(true);
              leftWindow.current = false;
            }}
            onBlur={(e) => {
              // The window losing focus blurs the input but leaves it the active element.
              leftWindow.current = document.activeElement === e.currentTarget;
            }}
            onKeyDown={onKeyDown}
            className="h-11 rounded-r-none border-foreground/60 pl-10"
          />
        </div>
        <Button type="submit" size="lg" className="rounded-l-none px-5">
          Ara
        </Button>
        {expanded && (
          // biome-ignore lint/a11y/noStaticElementInteractions: only keeps focus where it is
          <div
            className="absolute inset-x-0 top-full z-50 mt-1 max-h-[60dvh] overflow-y-auto overscroll-contain rounded-md border bg-card shadow-lg"
            onMouseDown={(e) => e.preventDefault()}
          >
            {groups.length === 0 && (
              <p role="status" className="px-3 py-2 text-muted-foreground">
                Sonuç bulunamadı
              </p>
            )}
            <SuggestionList
              id={LIST_ID}
              suggestions={suggestions}
              allResultsHref={router.buildLocation(results(term)).href}
              active={active}
              onChoose={choose}
            />
          </div>
        )}
      </form>
    </search>
  );
}
