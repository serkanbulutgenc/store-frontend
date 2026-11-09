import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiErrorToFormErrors } from "../../forms/api-errors";
import { bind, Field, FormActions, FormMessage } from "../../forms/field";
import { useAdjustStock } from "../queries";
import { stockAdjustmentSchema } from "../schemas";

export type AdjustTarget = { id: number; label: string; onHand: number };

/** Manual stock correction: a signed whole number and a mandatory reason (audit-logged server-side). */
export function AdjustStockDialog({
  target,
  onClose,
}: {
  target: AdjustTarget | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={target !== null} onClose={onClose} title="Stok düzeltmesi">
      {target && <AdjustForm target={target} onClose={onClose} />}
    </Dialog>
  );
}

function AdjustForm({ target, onClose }: { target: AdjustTarget; onClose: () => void }) {
  const adjust = useAdjustStock();
  const form = useForm({
    defaultValues: { delta: "", reason: "" },
    validators: {
      onSubmit: stockAdjustmentSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          const parsed = stockAdjustmentSchema.parse(value);
          await adjust.mutateAsync({ id: target.id, ...parsed });
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        return undefined;
      },
    },
    onSubmit: () => {
      toast.success("Stok güncellendi.");
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
      <p className="text-muted-foreground">
        {target.label} · Mevcut stok: <strong className="text-foreground">{target.onHand}</strong>
      </p>
      <form.Field name="delta">
        {(f) => (
          <Field field={f} label="Değişim" hint="Artış için 5, azalış için -2 yazın.">
            <Input inputMode="numeric" autoFocus {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Field name="reason">
        {(f) => (
          <Field field={f} label="Gerekçe">
            <Input {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => <FormMessage error={err} />}
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => <FormActions submitting={submitting} onClose={onClose} />}
      </form.Subscribe>
    </form>
  );
}
