import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import type { ZodType } from "zod";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiErrorToFormErrors } from "../../forms/api-errors";
import { bind, Field, FormActions, FormMessage } from "../../forms/field";

type Values = Record<string, string>;

export type FieldSpec = {
  name: string;
  label: string;
  hint?: string;
  options?: { value: string; label: string }[];
};

/**
 * One dialog for every order action that takes input: schema-validated fields, API errors
 * mapped back onto the form, a toast and close on success.
 */
export function ActionDialog({
  open,
  title,
  intro,
  fields,
  defaults,
  schema,
  success,
  submit,
  onClose,
}: {
  open: boolean;
  title: string;
  intro?: string;
  fields: FieldSpec[];
  defaults: Values;
  schema: ZodType;
  success: string;
  // The schema has already validated the values; callers receive them typed for their action.
  // biome-ignore lint/suspicious/noExplicitAny: validated by `schema`
  submit: (parsed: any) => Promise<unknown>;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      {open && (
        <ActionForm
          intro={intro}
          fields={fields}
          defaults={defaults}
          schema={schema}
          success={success}
          submit={submit}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}

function ActionForm({
  intro,
  fields,
  defaults,
  schema,
  success,
  submit,
  onClose,
}: Omit<Parameters<typeof ActionDialog>[0], "open" | "title">) {
  const form = useForm({
    defaultValues: defaults as Values,
    validators: {
      onSubmitAsync: async ({ value }) => {
        const parsed = schema.safeParse(value);
        if (!parsed.success) {
          const fields: Record<string, string> = {};
          for (const issue of parsed.error.issues) {
            const key = String(issue.path[0] ?? "");
            if (key && !fields[key]) fields[key] = issue.message;
          }
          return { form: "", fields };
        }
        try {
          await submit(parsed.data as Values);
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        return undefined;
      },
    },
    onSubmit: () => {
      toast.success(success);
      onClose();
    },
  });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      {intro && <p className="text-muted-foreground">{intro}</p>}
      {fields.map((spec, i) => (
        <form.Field key={spec.name} name={spec.name}>
          {(f) => (
            <Field field={f} label={spec.label} hint={spec.hint}>
              {spec.options ? (
                <Select {...bind(f)}>
                  {spec.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input autoFocus={i === 0} {...bind(f)} />
              )}
            </Field>
          )}
        </form.Field>
      ))}
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => <FormMessage error={err} />}
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => <FormActions submitting={submitting} onClose={onClose} />}
      </form.Subscribe>
    </form>
  );
}
