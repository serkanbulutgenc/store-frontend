import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { adminApi } from "@/lib/api/clients";
import { apiErrorToFormErrors } from "../forms/api-errors";
import { bind, Field, FormActions, FormMessage } from "../forms/field";
import {
  createBody,
  editBody,
  type VoucherRow,
  type VoucherValues,
  voucherCapHint,
  voucherDefaults,
  voucherFormSchemaFor,
  voucherLocks,
} from "./form";
import { voucherKeys } from "./queries";

/** The body of the create/edit dialog. The rules, bodies and locks live in `form.ts`. */
export function VoucherForm({ row, onClose }: { row?: VoucherRow; onClose: () => void }) {
  const qc = useQueryClient();
  const schema = voucherFormSchemaFor(row?.redemptions ?? 0);
  const locks = row ? voucherLocks(row) : {};
  const save = useMutation({
    mutationFn: async (values: VoucherValues) => {
      if (!row) return adminApi.POST("/api/admin/vouchers", { body: createBody(values) });
      const body = editBody(values, row);
      if (Object.keys(body).length === 0) return null; // nothing changed: nothing to send
      return adminApi.PATCH("/api/admin/vouchers/{voucher_id}", {
        params: { path: { voucher_id: row.id } },
        body,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: voucherKeys.all }),
  }).mutateAsync;
  const form = useForm({
    defaultValues: voucherDefaults(row),
    validators: {
      onSubmit: schema,
      onSubmitAsync: async ({ value }) => {
        try {
          await save(schema.parse(value));
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        return undefined;
      },
    },
    onSubmit: () => {
      toast.success("Kaydedildi.");
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
      <form.Field name="code">
        {(f) => (
          <Field
            field={f}
            label="Kupon kodu"
            hint={locks.code ?? "3-20 karakter: harf, rakam ve tire. Büyük harfe çevrilir."}
          >
            <Input autoFocus {...bind(f)} disabled={"code" in locks} />
          </Field>
        )}
      </form.Field>
      <form.Field name="kind">
        {(f) => (
          <Field
            field={f}
            label="İndirim türü"
            hint={row ? "Tür sonradan değiştirilemez." : undefined}
          >
            <Select {...bind(f)} disabled={row !== undefined}>
              <option value="percentage">Yüzde</option>
              <option value="fixed">Sabit tutar (₺)</option>
            </Select>
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.values.kind}>
        {(kind) => (
          <form.Field name="value">
            {(f) => (
              <Field
                field={f}
                label={kind === "percentage" ? "İndirim yüzdesi" : "İndirim tutarı (₺)"}
                hint={kind === "percentage" ? "1 ile 100 arasında." : "Sıfırdan büyük."}
              >
                <Input inputMode="decimal" {...bind(f)} />
              </Field>
            )}
          </form.Field>
        )}
      </form.Subscribe>
      <form.Field name="minimum">
        {(f) => (
          <Field
            field={f}
            label="Alt sınır (₺)"
            hint="Sepet tutarı en az bu kadar olmalı. Boşsa sınır yok."
          >
            <Input inputMode="decimal" {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Field name="cap">
        {(f) => (
          <Field
            field={f}
            label="Toplam kullanım sınırı"
            hint={(row && voucherCapHint(row)) ?? "Boşsa sınırsız."}
          >
            <Input inputMode="numeric" {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="starts_at">
          {(f) => (
            <Field field={f} label="Başlangıç" hint="Boşsa hemen başlar.">
              <Input type="datetime-local" {...bind(f)} />
            </Field>
          )}
        </form.Field>
        <form.Field name="ends_at">
          {(f) => (
            <Field field={f} label="Bitiş" hint="Boşsa süresiz.">
              <Input type="datetime-local" {...bind(f)} />
            </Field>
          )}
        </form.Field>
      </div>
      <form.Field name="once_per_customer">
        {(f) => (
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={f.state.value}
              disabled={"once_per_customer" in locks}
              onChange={(e) => f.handleChange(e.target.checked)}
            />
            <span>
              <span className="font-medium">Müşteri başına bir kez</span>
              <span className="block text-muted-foreground">
                {locks.once_per_customer ?? "Aynı müşteri kodu yalnızca bir kez kullanabilir."}
              </span>
            </span>
          </label>
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
