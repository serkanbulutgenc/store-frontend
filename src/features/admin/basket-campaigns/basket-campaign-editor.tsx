import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { adminApi } from "@/lib/api/clients";
import { apiErrorToFormErrors } from "../forms/api-errors";
import { bind, Field, FormActions, FormMessage } from "../forms/field";
import {
  activationChange,
  type BasketCampaignValues,
  basketCampaignDefaults,
  basketCampaignFormSchema,
  createBody,
  editBody,
} from "./form";
import { basketCampaignKeys, basketCampaignQuery } from "./queries";
import { type BasketCampaignRow, BENEFITS, type Benefit, ruleLabel } from "./rules";

/** The Basket Campaign's own admin page: a new one is a blank form, an existing one loads first.
 * Leaving goes back to the Sepet kampanyaları tab. */
export function BasketCampaignEditorPage({ id }: { id?: number }) {
  const navigate = useNavigate();
  const onClose = () => void navigate({ to: "/admin/campaigns", search: { tab: "basket" } });
  const { data: row, isError } = useQuery({
    ...basketCampaignQuery(id ?? 0),
    enabled: id !== undefined,
  });
  if (id !== undefined && isError) {
    return (
      <div className="max-w-3xl space-y-3">
        <p role="alert">Sepet kampanyası bulunamadı.</p>
        <Button size="sm" onClick={onClose}>
          Kampanyalara dön
        </Button>
      </div>
    );
  }
  if (id !== undefined && !row) return <p className="text-muted-foreground">Yükleniyor…</p>;
  return (
    <div className="max-w-3xl space-y-3">
      <h1 className="text-lg font-semibold">{row ? row.name : "Yeni sepet kampanyası"}</h1>
      <BasketCampaignEditor row={row} onClose={onClose} />
    </div>
  );
}

const VALUE_FIELD: Record<Exclude<Benefit, "free_shipping">, { label: string; hint: string }> = {
  fixed: {
    label: "İndirim tutarı (₺)",
    hint: "Sepet tutarından küçük olmalı. Ürün fiyatları kampanyalı hâliyle toplanır.",
  },
  percentage: { label: "İndirim yüzdesi", hint: "1 ile 99 arasında." },
};

function BasketCampaignEditor({
  row: loaded,
  onClose,
}: {
  row?: BasketCampaignRow;
  onClose: () => void;
}) {
  // The Campaign as it was when the page opened; an edit is worked out against it.
  const [row] = useState(loaded);
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: async (values: BasketCampaignValues) => {
      if (!row) {
        return (await adminApi.POST("/api/admin/basket-campaigns", { body: createBody(values) }))
          .data;
      }
      const body = editBody(values, row);
      const params = { params: { path: { campaign_id: row.id } } };
      if (Object.keys(body).length > 0) {
        await adminApi.PATCH("/api/admin/basket-campaigns/{campaign_id}", { ...params, body });
      }
      // The on/off switch has its own endpoints, so it goes after the fields.
      const change = activationChange(values, row);
      if (change === "activate") {
        await adminApi.POST("/api/admin/basket-campaigns/{campaign_id}/activate", params);
      } else if (change === "deactivate") {
        await adminApi.POST("/api/admin/basket-campaigns/{campaign_id}/deactivate", params);
      }
      return null;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: basketCampaignKeys.all }),
  }).mutateAsync;
  const form = useForm({
    defaultValues: basketCampaignDefaults(row),
    validators: {
      onSubmit: basketCampaignFormSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await save(basketCampaignFormSchema.parse(value));
          toast.success("Kaydedildi.");
          onClose();
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        return undefined;
      },
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
      <form.Field name="name">
        {(f) => (
          <Field field={f} label="Kampanya adı" hint="Yalnızca sizin göreceğiniz iç ad.">
            <Input autoFocus {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Field name="minimum_amount">
        {(f) => (
          <Field
            field={f}
            label="Asgari sepet tutarı (₺)"
            hint="Ürünlerin (kampanyalı fiyatlarıyla) toplamı bu tutara ulaşınca uygulanır; kupon indiriminden önce ölçülür."
          >
            <Input inputMode="decimal" {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Field name="benefit">
        {(f) => (
          <Field field={f} label="Ne sağlar?">
            <Select {...bind(f)}>
              {BENEFITS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.values.benefit}>
        {(benefit) =>
          benefit === "free_shipping" ? (
            <p className="text-muted-foreground">
              Kargo ücreti alınmaz; kapıda ödeme bedeli varsa o alınmaya devam eder.
            </p>
          ) : (
            <form.Field name="value">
              {(f) => (
                <Field
                  field={f}
                  label={VALUE_FIELD[benefit].label}
                  hint={VALUE_FIELD[benefit].hint}
                >
                  <Input inputMode="decimal" {...bind(f)} />
                </Field>
              )}
            </form.Field>
          )
        }
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.values}>
        {(v) => {
          const minimum = v.minimum_amount.trim().replace(",", ".");
          const value = v.value.trim().replace(",", ".");
          const ok = /^\d+(\.\d{1,2})?$/.test(minimum) && Number(minimum) > 0;
          const withValue = v.benefit === "free_shipping" || /^\d+(\.\d{1,2})?$/.test(value);
          return (
            <p className="rounded-md border border-border bg-muted/40 p-3">
              <span className="text-muted-foreground">Müşteri sepette şunu görür: </span>
              <strong>
                {ok && withValue
                  ? ruleLabel(v.benefit, minimum, v.benefit === "free_shipping" ? null : value)
                  : "—"}
              </strong>
            </p>
          );
        }}
      </form.Subscribe>

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
      <form.Field name="is_active">
        {(f) => (
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={f.state.value}
              onChange={(e) => f.handleChange(e.target.checked)}
            />
            <span>
              <span className="font-medium">Açık</span>
              <span className="block text-muted-foreground">
                Kapalı bir kampanya, tarihleri ne olursa olsun uygulanmaz.
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
