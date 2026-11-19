import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/api/clients";
import { categoriesQuery, productsQuery } from "../catalog/queries";
import { collectionsQuery } from "../collections/queries";
import { apiErrorToFormErrors } from "../forms/api-errors";
import { bind, errorText, Field, FormActions, FormMessage } from "../forms/field";
import {
  activationChange,
  type CampaignRow,
  type CampaignValues,
  campaignDefaults,
  campaignFormSchema,
  createBody,
  editBody,
  type Target,
} from "./form";
import { BelowCostWarning } from "./notices";
import { campaignKeys, campaignQuery } from "./queries";
import { TargetPicker } from "./target-picker";

/** The dialog body: a new Campaign is a blank form, an existing one loads in full first (the
 * list rows carry no targets or below-cost Products). */
export function CampaignDialogBody({ id, onClose }: { id?: number; onClose: () => void }) {
  const { data: row, isError } = useQuery({ ...campaignQuery(id ?? 0), enabled: id !== undefined });
  if (id !== undefined && isError) {
    // A stale or mistyped `?edit=` address: say so instead of loading forever.
    return (
      <div className="space-y-3">
        <p role="alert">Kampanya bulunamadı.</p>
        <div className="flex justify-end">
          <Button size="sm" onClick={onClose}>
            Tamam
          </Button>
        </div>
      </div>
    );
  }
  if (id !== undefined && !row) return <p className="text-muted-foreground">Yükleniyor…</p>;
  return <CampaignEditor row={row} onClose={onClose} />;
}

const includes = (name: string, q: string) =>
  name.toLocaleLowerCase("tr").includes(q.trim().toLocaleLowerCase("tr"));

function CampaignEditor({ row: loaded, onClose }: { row?: CampaignRow; onClose: () => void }) {
  // The Campaign as it was when the dialog opened. The form starts from it and an edit is
  // worked out against it, so a refetch while the dialog is open cannot make them disagree.
  const [row] = useState(loaded);
  const qc = useQueryClient();
  // Saving works whatever the Products cost; if some end up below cost the Owner is told here,
  // with the dialog left open until they have read it.
  const [saved, setSaved] = useState<CampaignRow | null>(null);
  const [productQ, setProductQ] = useState("");
  const [categoryQ, setCategoryQ] = useState("");
  const [collectionQ, setCollectionQ] = useState("");
  const term = productQ.trim();
  const products = useQuery({
    ...productsQuery({ page: 1, size: 10, q: term }),
    enabled: term.length >= 2,
  });
  const categories = useQuery(categoriesQuery);
  const collections = useQuery(collectionsQuery());
  const save = useMutation({
    mutationFn: async (values: CampaignValues): Promise<CampaignRow | null> => {
      if (!row) {
        return (await adminApi.POST("/api/admin/campaigns", { body: createBody(values) }))
          .data as CampaignRow;
      }
      const body = editBody(values, row);
      const params = { params: { path: { campaign_id: row.id } } };
      let result: CampaignRow | null = null;
      if (Object.keys(body).length > 0) {
        result = (await adminApi.PATCH("/api/admin/campaigns/{campaign_id}", { ...params, body }))
          .data as CampaignRow;
      }
      // The on/off switch has its own endpoints, so it goes after the fields. If it fails the
      // fields are already saved; sending the form again repeats only what is still different.
      const change = activationChange(values, row);
      if (change === "activate") {
        result = (await adminApi.POST("/api/admin/campaigns/{campaign_id}/activate", params))
          .data as CampaignRow;
      } else if (change === "deactivate") {
        result = (await adminApi.POST("/api/admin/campaigns/{campaign_id}/deactivate", params))
          .data as CampaignRow;
      }
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.all }),
  }).mutateAsync;
  const form = useForm({
    defaultValues: campaignDefaults(row),
    validators: {
      onSubmit: campaignFormSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          const result = await save(campaignFormSchema.parse(value));
          if (result && result.below_cost.length > 0) setSaved(result);
          else toast.success("Kaydedildi.");
          if (!result || result.below_cost.length === 0) onClose();
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        return undefined;
      },
    },
  });

  if (saved) {
    return (
      <div className="space-y-3">
        <BelowCostWarning items={saved.below_cost} />
        <div className="flex justify-end">
          <Button size="sm" onClick={onClose}>
            Tamam
          </Button>
        </div>
      </div>
    );
  }
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      {row && <BelowCostWarning items={row.below_cost} />}
      <form.Field name="name">
        {(f) => (
          <Field field={f} label="Kampanya adı" hint="Yalnızca sizin göreceğiniz iç ad.">
            <Input autoFocus {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Field name="percentage">
        {(f) => (
          <Field
            field={f}
            label="İndirim yüzdesi"
            hint="1 ile 99 arasında. Liste fiyatından düşer."
          >
            <Input inputMode="decimal" {...bind(f)} />
          </Field>
        )}
      </form.Field>

      <fieldset className="space-y-3 rounded-md border border-border p-3">
        <legend className="px-1 font-medium">Hedefler</legend>
        <form.Field name="products">
          {(f) => (
            <>
              <TargetPicker
                label="Ürünler"
                placeholder="Ürün adı veya kodu (en az 2 harf)"
                chosen={f.state.value}
                onChange={f.handleChange}
                matches={(products.data?.items ?? []).map((p) => ({ id: p.id, name: p.title }))}
                onSearch={setProductQ}
                minChars={2}
              />
              {f.state.meta.errors.length > 0 && (
                <span className="block text-red-700">{errorText(f.state.meta.errors[0])}</span>
              )}
            </>
          )}
        </form.Field>
        <form.Field name="categories">
          {(f) => (
            <TargetPicker
              label="Kategoriler"
              placeholder="Kategori ara"
              chosen={f.state.value}
              onChange={f.handleChange}
              matches={(categories.data ?? [])
                .filter((c) => includes(c.name, categoryQ))
                .map((c) => ({ id: c.id, name: c.name }))}
              onSearch={setCategoryQ}
              footer={
                f.state.value.length > 0 && (
                  <form.Field name="include_subcategories">
                    {(sub) => (
                      <label className="flex items-start gap-2 pt-1">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={sub.state.value}
                          onChange={(e) => sub.handleChange(e.target.checked)}
                        />
                        <span>
                          <span className="font-medium">Alt kategorileri de kapsa</span>
                          <span className="block text-muted-foreground">
                            Seçilen kategorilerin altındaki kategorilerdeki ürünler de dahil olur.
                          </span>
                        </span>
                      </label>
                    )}
                  </form.Field>
                )
              }
            />
          )}
        </form.Field>
        <form.Field name="collections">
          {(f) => (
            <TargetPicker
              label="Koleksiyonlar"
              placeholder="Koleksiyon ara"
              chosen={f.state.value}
              onChange={f.handleChange}
              matches={(collections.data ?? [])
                .filter((c) => includes(c.name, collectionQ))
                .map((c): Target => ({ id: c.id, name: c.name }))}
              onSearch={setCollectionQ}
            />
          )}
        </form.Field>
      </fieldset>

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
