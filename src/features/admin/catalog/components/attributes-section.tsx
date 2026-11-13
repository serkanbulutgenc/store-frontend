import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import { can, type Me } from "@/lib/api/me";
import { chooseOption, type Drafts, draftsFrom, isDirty, toBody } from "../attribute-values";
import { type AttributeOut, attributesQuery, useSetProductAttributes } from "../attributes-queries";
import type { ProductOut } from "../queries";

/** Staff fill in the values of the attributes the Owner defined for the Product's class. */
export function AttributesSection({ product, me }: { product: ProductOut; me: Me }) {
  const { data: attributes } = useSuspenseQuery(attributesQuery(product.product_class.id));
  const stored = product.attribute_values;
  const [drafts, setDrafts] = useState<Drafts>(() => draftsFrom(attributes, stored));
  const save = useSetProductAttributes(product.id);
  const canManage = can(me, "manage_products");
  const dirty = isDirty(attributes, stored, drafts);

  if (attributes.length === 0) {
    return (
      <p className="text-muted-foreground">
        “{product.product_class.name}” sınıfı için tanımlı özellik yok. Özellikleri Owner “Ürün
        sınıfları” ekranından tanımlar.
      </p>
    );
  }

  const patch = (id: number, change: Partial<Drafts[number]>) =>
    setDrafts((d) => ({ ...d, [id]: { text: "", optionIds: [], ...d[id], ...change } }));

  async function onSave() {
    try {
      const next = await save.mutateAsync(toBody(attributes, drafts));
      setDrafts(draftsFrom(attributes, next));
      toast.success("Özellikler kaydedildi.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Kaydedilemedi.");
    }
  }

  return (
    <section className="max-w-3xl space-y-4">
      <p className="text-muted-foreground">Boş bırakılan özellik ürün sayfasında gösterilmez.</p>
      {attributes.map((a) => (
        <AttributeField
          key={a.id}
          attribute={a}
          draft={drafts[a.id] ?? { text: "", optionIds: [] }}
          disabled={!canManage}
          onChange={(change) => patch(a.id, change)}
        />
      ))}
      {canManage && (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!dirty || save.isPending}
            onClick={() => setDrafts(draftsFrom(attributes, stored))}
          >
            Vazgeç
          </Button>
          <Button size="sm" disabled={!dirty || save.isPending} onClick={onSave}>
            Kaydet
          </Button>
        </div>
      )}
    </section>
  );
}

function AttributeField({
  attribute: a,
  draft,
  disabled,
  onChange,
}: {
  attribute: AttributeOut;
  draft: Drafts[number];
  disabled: boolean;
  onChange: (change: Partial<Drafts[number]>) => void;
}) {
  const id = `attr-${a.id}`;
  if (a.kind === "text") {
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="block font-medium">
          {a.name}
        </label>
        <Input
          id={id}
          value={draft.text}
          maxLength={500}
          disabled={disabled}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </div>
    );
  }
  if (a.is_multiple) {
    return (
      <fieldset className="space-y-1">
        <legend className="font-medium">
          {a.name}{" "}
          <span className="font-normal text-muted-foreground">(birden fazla seçilebilir)</span>
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {a.options.map((o) => (
            <label key={o.id} className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={draft.optionIds.includes(o.id)}
                disabled={disabled}
                onChange={() => onChange({ optionIds: chooseOption(a, draft.optionIds, o.id) })}
              />
              {o.label}
            </label>
          ))}
          {a.options.length === 0 && (
            <span className="text-muted-foreground">Bu özellik için henüz seçenek yok.</span>
          )}
        </div>
      </fieldset>
    );
  }
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-medium">
        {a.name}
      </label>
      <Select
        id={id}
        value={draft.optionIds[0] ?? ""}
        disabled={disabled}
        onChange={(e) =>
          onChange({
            optionIds: chooseOption(
              a,
              draft.optionIds,
              e.target.value ? Number(e.target.value) : null,
            ),
          })
        }
      >
        <option value="">—</option>
        {a.options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
