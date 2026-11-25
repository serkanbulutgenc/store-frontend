import { useQueries, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { type BannerRow, bannersQuery } from "../banners/queries";
import { TargetPicker } from "../campaigns/target-picker";
import { categoriesQuery, productQuery, productsQuery } from "../catalog/queries";
import { collectionsQuery } from "../collections/queries";
import {
  type BannerSettings,
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
  type SettingsPatch,
  SLIDER_SOURCE_LABELS,
  type SliderSettings,
  type SliderSource,
  WINDOWS,
  type Window,
} from "./layout";

type Patch = SettingsPatch;

/** The settings only a Products or Categories section has: where its items come from. */
export function SectionSettings({
  section,
  onChange,
}: {
  section: Section;
  onChange: (patch: Patch) => void;
}) {
  if (section.type === "slider") {
    return <SliderFields id={section.id} settings={section.settings} onChange={onChange} />;
  }
  if (section.type === "banner") {
    return <BannerFields id={section.id} settings={section.settings} onChange={onChange} />;
  }
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

const SLOT_LABELS: Record<string, string> = { home_hero: "Ana slayt", home_mid: "Orta afiş" };

const bannerName = (b: BannerRow) =>
  `#${b.id} · ${SLOT_LABELS[b.slot] ?? b.slot}${b.link ? ` · ${b.link}` : ""}`;

/** Published Banners that can sit on the home page: the hero and mid-page Slots. */
function useHomeBanners() {
  const banners = useQuery(bannersQuery("published"));
  return (banners.data ?? []).filter((b) => b.slot in SLOT_LABELS);
}

function SliderFields({
  id,
  settings,
  onChange,
}: {
  id: string;
  settings: SliderSettings;
  onChange: (patch: Patch) => void;
}) {
  const field = (suffix: string) => `section-${id}-${suffix}`;
  const available = useHomeBanners();
  const collections = useQuery(collectionsQuery("published"));
  const [q, setQ] = useState("");
  const picked = settings.banner_ids ?? [];
  const chosen = picked.map((bid) => {
    const b = available.find((x) => x.id === bid);
    return { id: bid, name: b ? bannerName(b) : `Afiş #${bid} (yayında değil)` };
  });
  return (
    <>
      <div className="space-y-1">
        <label htmlFor={field("source")} className="block font-medium">
          Slayt nereden gelsin?
        </label>
        <Select
          id={field("source")}
          value={settings.source}
          onChange={(e) => onChange({ source: e.target.value as SliderSource })}
        >
          {(Object.keys(SLIDER_SOURCE_LABELS) as SliderSource[]).map((k) => (
            <option key={k} value={k}>
              {SLIDER_SOURCE_LABELS[k]}
            </option>
          ))}
        </Select>
      </div>
      {settings.source === "collection" && (
        <div className="space-y-1">
          <label htmlFor={field("collection")} className="block font-medium">
            Koleksiyon
          </label>
          <Select
            id={field("collection")}
            value={settings.collection_id ?? ""}
            onChange={(e) =>
              onChange({ collection_id: e.target.value === "" ? null : Number(e.target.value) })
            }
          >
            <option value="">Seçin…</option>
            {(collections.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      {settings.source === "banners" && (
        <div className="sm:col-span-2">
          <TargetPicker
            label="Afişler"
            placeholder="Afiş ara"
            chosen={chosen}
            onChange={(next) => onChange({ banner_ids: next.map((t) => t.id) })}
            matches={available
              .map((b) => ({ id: b.id, name: bannerName(b) }))
              .filter((t) =>
                t.name.toLocaleLowerCase("tr").includes(q.trim().toLocaleLowerCase("tr")),
              )}
            onSearch={setQ}
          />
          <p className="text-muted-foreground">
            Tarihi geçmiş veya yayından kalkmış afişler ana sayfada gösterilmez.
          </p>
        </div>
      )}
    </>
  );
}

function BannerFields({
  id,
  settings,
  onChange,
}: {
  id: string;
  settings: BannerSettings;
  onChange: (patch: Patch) => void;
}) {
  const field = (suffix: string) => `section-${id}-${suffix}`;
  const available = useHomeBanners();
  const missing = settings.banner_id != null && !available.some((b) => b.id === settings.banner_id);
  return (
    <div className="space-y-1">
      <label htmlFor={field("banner")} className="block font-medium">
        Afiş
      </label>
      <Select
        id={field("banner")}
        value={settings.banner_id ?? ""}
        onChange={(e) =>
          onChange({ banner_id: e.target.value === "" ? null : Number(e.target.value) })
        }
      >
        <option value="">Sıradaki orta afiş</option>
        {missing && (
          <option value={settings.banner_id ?? ""}>
            Afiş #{settings.banner_id} (yayında değil)
          </option>
        )}
        {available.map((b) => (
          <option key={b.id} value={b.id}>
            {bannerName(b)}
          </option>
        ))}
      </Select>
    </div>
  );
}
