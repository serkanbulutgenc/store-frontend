import { useQueries, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TargetPicker } from "../campaigns/target-picker";
import { categoriesQuery, productQuery, productsQuery } from "../catalog/queries";
import {
  CATEGORY_SOURCE_LABELS,
  type CategoriesSettings,
  type CategorySource,
  clampCount,
  MAX_ITEMS,
  MIN_ITEMS,
  PRODUCT_SOURCE_LABELS,
  type ProductSource,
  type ProductsSettings,
  type Section,
  WINDOWS,
  type Window,
} from "./layout";

type Patch = Partial<ProductsSettings> | Partial<CategoriesSettings>;

/** The settings only a Products or Categories section has: where its items come from. */
export function SectionSettings({
  section,
  onChange,
}: {
  section: Section;
  onChange: (patch: Patch) => void;
}) {
  if (section.type === "products") {
    return <ProductsFields id={section.id} settings={section.settings} onChange={onChange} />;
  }
  if (section.type === "categories") {
    return <CategoriesFields id={section.id} settings={section.settings} onChange={onChange} />;
  }
  return null;
}

function CountField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-medium">
        Ürün sayısı ({MIN_ITEMS}–{MAX_ITEMS})
      </label>
      <Input
        id={id}
        type="number"
        min={MIN_ITEMS}
        max={MAX_ITEMS}
        value={value}
        onChange={(e) => onChange(clampCount(e.target.valueAsNumber))}
      />
    </div>
  );
}

function ProductsFields({
  id,
  settings,
  onChange,
}: {
  id: string;
  settings: ProductsSettings;
  onChange: (patch: Patch) => void;
}) {
  const field = (suffix: string) => `section-${id}-${suffix}`;
  const categories = useQuery(categoriesQuery);
  const source = settings.source;
  return (
    <>
      <div className="space-y-1">
        <label htmlFor={field("source")} className="block font-medium">
          Ürünler nereden gelsin?
        </label>
        <Select
          id={field("source")}
          value={source}
          onChange={(e) => onChange({ source: e.target.value as ProductSource })}
        >
          {(Object.keys(PRODUCT_SOURCE_LABELS) as ProductSource[]).map((k) => (
            <option key={k} value={k}>
              {PRODUCT_SOURCE_LABELS[k]}
            </option>
          ))}
        </Select>
      </div>
      {source === "best_selling" && (
        <div className="space-y-1">
          <label htmlFor={field("window")} className="block font-medium">
            Satış dönemi
          </label>
          <Select
            id={field("window")}
            value={settings.window}
            onChange={(e) => onChange({ window: Number(e.target.value) as Window })}
          >
            {WINDOWS.map((w) => (
              <option key={w} value={w}>
                Son {w} gün
              </option>
            ))}
          </Select>
          <p className="text-muted-foreground">Dönemde satılan adete göre sıralanır.</p>
        </div>
      )}
      {source === "category" && (
        <div className="space-y-1">
          <label htmlFor={field("category")} className="block font-medium">
            Kategori
          </label>
          <Select
            id={field("category")}
            value={settings.category_id ?? ""}
            onChange={(e) =>
              onChange({ category_id: e.target.value === "" ? null : Number(e.target.value) })
            }
          >
            <option value="">Seçin…</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      {source === "hand_picked" && (
        <div className="sm:col-span-2">
          <ProductPicker
            ids={settings.product_ids ?? []}
            onChange={(product_ids) => onChange({ product_ids })}
          />
          <p className="text-muted-foreground">
            Yayında olmayan veya stoğu biten ürünler ana sayfada gösterilmez.
          </p>
        </div>
      )}
      {source !== "recently_viewed" && (
        <CountField
          id={field("count")}
          value={settings.count}
          onChange={(count) => onChange({ count })}
        />
      )}
    </>
  );
}

function ProductPicker({ ids, onChange }: { ids: number[]; onChange: (ids: number[]) => void }) {
  const [q, setQ] = useState("");
  const term = q.trim();
  const found = useQuery({
    ...productsQuery({ page: 1, size: 10, q: term }),
    enabled: term.length >= 2,
  });
  const names = useQueries({
    queries: ids.map((id) => productQuery(id)),
    combine: (rs) => rs.map((r, i) => ({ id: ids[i] as number, name: r.data?.title })),
  });
  const chosen = names.map((n) => ({ id: n.id, name: n.name ?? `Ürün ${n.id}` }));
  return (
    <TargetPicker
      label="Ürünler"
      placeholder="Ürün adı veya kodu (en az 2 harf)"
      chosen={chosen}
      onChange={(next) => onChange(next.map((t) => t.id))}
      matches={(found.data?.items ?? []).map((p) => ({ id: p.id, name: p.title }))}
      onSearch={setQ}
      minChars={2}
    />
  );
}

function CategoriesFields({
  id,
  settings,
  onChange,
}: {
  id: string;
  settings: CategoriesSettings;
  onChange: (patch: Patch) => void;
}) {
  const field = (suffix: string) => `section-${id}-${suffix}`;
  const categories = useQuery(categoriesQuery);
  const [q, setQ] = useState("");
  const all = categories.data ?? [];
  const picked = settings.category_ids ?? [];
  const chosen = picked.map((cid) => ({
    id: cid,
    name: all.find((c) => c.id === cid)?.name ?? `Kategori ${cid}`,
  }));
  return (
    <>
      <div className="space-y-1">
        <label htmlFor={field("source")} className="block font-medium">
          Kategoriler nereden gelsin?
        </label>
        <Select
          id={field("source")}
          value={settings.source}
          onChange={(e) => onChange({ source: e.target.value as CategorySource })}
        >
          {(Object.keys(CATEGORY_SOURCE_LABELS) as CategorySource[]).map((k) => (
            <option key={k} value={k}>
              {CATEGORY_SOURCE_LABELS[k]}
            </option>
          ))}
        </Select>
      </div>
      <CountField
        id={field("count")}
        value={settings.count}
        onChange={(count) => onChange({ count })}
      />
      {settings.source === "picked" && (
        <div className="sm:col-span-2">
          <TargetPicker
            label="Kategoriler"
            placeholder="Kategori ara"
            chosen={chosen}
            onChange={(next) => onChange({ category_ids: next.map((t) => t.id) })}
            matches={all
              .filter((c) =>
                c.name.toLocaleLowerCase("tr").includes(q.trim().toLocaleLowerCase("tr")),
              )
              .map((c) => ({ id: c.id, name: c.name }))}
            onSearch={setQ}
          />
        </div>
      )}
    </>
  );
}
