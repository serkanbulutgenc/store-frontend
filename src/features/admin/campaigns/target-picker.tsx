import { type ReactNode, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Target } from "./form";

/**
 * Chosen targets as removable chips, and a search that offers matches to add. The caller says
 * where the matches come from: a server search for Products, a plain list for the few
 * Categories and Collections.
 */
export function TargetPicker({
  label,
  placeholder,
  chosen,
  onChange,
  matches,
  onSearch,
  minChars = 0,
  footer,
}: {
  label: string;
  placeholder: string;
  chosen: Target[];
  onChange: (next: Target[]) => void;
  /** Candidates for the typed text; the picker hides the ones already chosen. */
  matches: Target[];
  onSearch: (text: string) => void;
  /** Letters needed before matches are offered. */
  minChars?: number;
  footer?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const id = useId();
  const taken = new Set(chosen.map((t) => t.id));
  const offered = q.trim().length >= minChars ? matches.filter((m) => !taken.has(m.id)) : [];
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-medium">
        {label} ({chosen.length})
      </label>
      {chosen.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {chosen.map((t) => (
            <li
              key={t.id}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5"
            >
              {t.name}
              <button
                type="button"
                aria-label={`${t.name} çıkar`}
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onChange(chosen.filter((c) => c.id !== t.id))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        id={id}
        type="search"
        placeholder={placeholder}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          onSearch(e.target.value);
        }}
      />
      {offered.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {offered.slice(0, 8).map((m) => (
            <li key={m.id} className="flex items-center gap-2 px-3 py-1.5">
              <span className="min-w-0 flex-1 truncate">{m.name}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={`${m.name} ekle`}
                onClick={() => {
                  onChange([...chosen, m]);
                  setQ("");
                  onSearch("");
                }}
              >
                Ekle
              </Button>
            </li>
          ))}
        </ul>
      )}
      {footer}
    </div>
  );
}
