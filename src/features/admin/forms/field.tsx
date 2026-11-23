import type { AnyFieldApi } from "@tanstack/react-form";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function errorText(e: unknown): string {
  return typeof e === "string"
    ? e
    : ((e as { message?: string } | null)?.message ?? "Geçersiz değer.");
}

/** Props that bind a native control to a TanStack Form field. */
export function bind(field: AnyFieldApi) {
  return {
    id: field.name,
    name: field.name,
    value: (field.state.value ?? "") as string,
    onBlur: field.handleBlur,
    onChange: (e: { target: { value: string } }) => field.handleChange(e.target.value),
    "aria-invalid": field.state.meta.errors.length > 0,
  };
}

/** Label, control and the first error for a field. */
export function Field({
  field,
  label,
  hint,
  children,
}: {
  field: AnyFieldApi;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  const errors = field.state.meta.errors;
  return (
    <div className="space-y-1">
      <label htmlFor={field.name} className="block font-medium">
        {label}
      </label>
      {children}
      {hint && errors.length === 0 && <span className="block text-muted-foreground">{hint}</span>}
      {errors.length > 0 && <span className="block text-red-700">{errorText(errors[0])}</span>}
    </div>
  );
}

/** A boolean setting as a labelled checkbox; the hint stays visible because it is a warning. */
export function SwitchField({
  field,
  label,
  hint,
}: {
  field: AnyFieldApi;
  label: string;
  hint?: string;
}) {
  const errors = field.state.meta.errors;
  return (
    <div className="space-y-1">
      <label htmlFor={field.name} className="flex items-center gap-2 font-medium">
        <input
          type="checkbox"
          id={field.name}
          name={field.name}
          checked={Boolean(field.state.value)}
          onChange={(e) => field.handleChange(e.target.checked)}
          onBlur={field.handleBlur}
          aria-describedby={hint ? `${field.name}-hint` : undefined}
          className="size-4 accent-primary"
        />
        {label}
      </label>
      {hint && (
        <span id={`${field.name}-hint`} className="block text-muted-foreground">
          {hint}
        </span>
      )}
      {errors.length > 0 && <span className="block text-red-700">{errorText(errors[0])}</span>}
    </div>
  );
}

/** The form-level message from `apiErrorToFormErrors`, unless a field already shows it. */
export function FormMessage({ error }: { error: unknown }) {
  const e = error as { form?: string; fields?: Record<string, string> } | string | undefined;
  const msg = typeof e === "string" ? e : (e?.form ?? null);
  const repeated = typeof e === "object" && Object.values(e?.fields ?? {}).includes(msg ?? "");
  return msg && !repeated ? (
    <p role="alert" className="text-red-700">
      {msg}
    </p>
  ) : null;
}

/** Dialog footer: cancel and save, with save disabled while submitting. */
export function FormActions({ submitting, onClose }: { submitting: boolean; onClose: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onClose}>
        Vazgeç
      </Button>
      <Button type="submit" size="sm" disabled={submitting}>
        Kaydet
      </Button>
    </div>
  );
}
