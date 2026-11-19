import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { pickerValue } from "../colour-input";

type Bound = {
  id: string;
  name: string;
  value: string;
  onBlur: () => void;
  onChange: (e: { target: { value: string } }) => void;
  "aria-invalid": boolean;
};

/** The hex text input with a native colour picker at its start. Typing and picking write the
 * same `#RRGGBB` string; the picker keeps the last valid colour while the text is invalid. */
export function ColourField({ bound, disabled }: { bound: Bound; disabled?: boolean }) {
  const last = useRef("#000000");
  const shown = pickerValue(bound.value, last.current);
  last.current = shown;
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label="Renk seç"
        value={shown}
        disabled={disabled}
        onChange={(e) => bound.onChange({ target: { value: e.target.value } })}
        className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-card p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <Input {...bound} disabled={disabled} />
    </div>
  );
}
