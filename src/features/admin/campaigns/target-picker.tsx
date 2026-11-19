import { type KeyboardEvent, type ReactNode, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import type { Target } from "./form";
import { offeredTargets, type PickerKey, pickerKey } from "./target-picker-rules";

/**
 * Chosen targets as removable chips, and an autocomplete field that offers matches in a dropdown
 * while it is focused: type to narrow, arrow keys and Enter (or a click) to add. The caller says
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
  const [state, setState] = useState({ open: false, active: 0 });
  const id = useId();
  const listId = `${id}-list`;
  const offered = offeredTargets(matches, chosen, q, minChars);
  const open = state.open && offered.length > 0;
  const active = Math.min(state.active, offered.length - 1);
  const optionId = (n: number) => `${id}-option-${n}`;

  function add(target: Target) {
    onChange([...chosen, target]);
    setQ("");
    onSearch("");
    setState({ open: false, active: 0 });
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) return;
    const next = pickerKey(
      { open, active: Math.max(active, 0) },
      e.key as PickerKey,
      offered.length,
    );
    // Enter in a form submits it, and Escape closes the dialog: only take them while open.
    if (open || e.key.startsWith("Arrow")) e.preventDefault();
    if (e.key === "Escape" && open) e.stopPropagation();
    setState({ open: next.open, active: next.active });
    const picked = next.pick === null ? undefined : offered[next.pick];
    if (picked) add(picked);
  }

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
      <div className="relative">
        <Input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open ? optionId(active) : undefined}
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onSearch(e.target.value);
            setState({ open: true, active: 0 });
          }}
          onFocus={() => setState((s) => ({ ...s, open: true }))}
          onBlur={() => setState({ open: false, active: 0 })}
          onKeyDown={onKeyDown}
        />
        {open && (
          <div
            id={listId}
            role="listbox"
            aria-label={`Öneriler: ${label}`}
            className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-card py-1 shadow-md"
          >
            {offered.map((m, n) => (
              <div
                key={m.id}
                id={optionId(n)}
                role="option"
                tabIndex={-1}
                aria-selected={n === active}
                className={`cursor-pointer truncate px-3 py-1.5 ${n === active ? "bg-muted" : ""}`}
                // Before the input loses focus, which would close the list and swallow the click.
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(m);
                }}
                onMouseEnter={() => setState({ open: true, active: n })}
              >
                {m.name}
              </div>
            ))}
          </div>
        )}
      </div>
      {footer}
    </div>
  );
}
