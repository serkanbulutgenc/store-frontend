import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  BUILTIN_PAGES,
  checkItem,
  type ItemDraft,
  TARGET_TYPES,
  type TargetType,
  typeLabel,
} from "./item";
import { type MenuTarget, menuTargetsQuery } from "./queries";
import { cutOffNote, type MenuItemRow } from "./tree";

type Props = {
  /** The item being edited; absent when adding. */
  item?: MenuItemRow;
  /** Level the item sits at (1 is the top) and the Menu's limit, for the subcategory note. */
  depth: number;
  limit: number;
  /** Levels of subcategories below a Category, to tell whether the limit cuts them off. */
  subtreeDepth: (categoryId: number) => number;
  onSave: (item: MenuItemRow) => void;
  onClose: () => void;
};

/** The target an existing item points at, in the shape the picker returns. */
const pickedFrom = (item?: MenuItemRow): MenuTarget | null =>
  item &&
  (item.category_id ??
    item.product_id ??
    item.brand_id ??
    item.collection_id ??
    item.campaign_page_id ??
    item.legal_page) != null
    ? {
        target_type: item.target_type as MenuTarget["target_type"],
        target_label: item.target_label,
        category_id: item.category_id,
        product_id: item.product_id,
        brand_id: item.brand_id,
        collection_id: item.collection_id,
        campaign_page_id: item.campaign_page_id,
        legal_page: item.legal_page,
      }
    : null;

export function ItemDialog({ open, ...props }: Props & { open: boolean }) {
  return (
    <Dialog
      open={open}
      onClose={props.onClose}
      title={props.item ? "Öğeyi düzenle" : "Menüye öğe ekle"}
    >
      {open && <ItemForm {...props} />}
    </Dialog>
  );
}

function ItemForm({ item, depth, limit, subtreeDepth, onSave, onClose }: Props) {
  const [type, setType] = useState<TargetType>(item?.target_type ?? "category");
  const [picked, setPicked] = useState<MenuTarget | null>(pickedFrom(item));
  const [builtin, setBuiltin] = useState(item?.builtin ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [label, setLabel] = useState(item?.label ?? "");
  const [include, setInclude] = useState(item?.include_subcategories ?? false);
  const [q, setQ] = useState("");
  const [tried, setTried] = useState(false);

  const searchable =
    type === "category" ||
    type === "legal_page" ||
    type === "product" ||
    type === "brand" ||
    type === "collection" ||
    type === "campaign_page";
  const { data: found = [] } = useQuery({ ...menuTargetsQuery(q), enabled: searchable });
  const matches = found.filter((t) => t.target_type === type).slice(0, 8);

  const draft: ItemDraft = {
    target_type: type,
    label,
    url,
    has_target: type === "builtin" ? builtin !== "" : picked !== null,
    include_subcategories: include,
  };
  const errors = tried ? checkItem(draft) : {};
  const note =
    type === "category" && include && picked?.category_id != null
      ? cutOffNote({ depth, limit, subtreeDepth: subtreeDepth(picked.category_id) })
      : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (Object.keys(checkItem(draft)).length > 0) return;
    const builtinLabel = BUILTIN_PAGES.find((p) => p.value === builtin)?.label;
    onSave({
      target_type: type,
      category_id: type === "category" ? (picked?.category_id ?? null) : null,
      product_id: type === "product" ? (picked?.product_id ?? null) : null,
      brand_id: type === "brand" ? (picked?.brand_id ?? null) : null,
      collection_id: type === "collection" ? (picked?.collection_id ?? null) : null,
      campaign_page_id: type === "campaign_page" ? (picked?.campaign_page_id ?? null) : null,
      legal_page: type === "legal_page" ? (picked?.legal_page ?? null) : null,
      builtin: type === "builtin" ? builtin : null,
      url: type === "url" ? url.trim() : null,
      include_subcategories: type === "category" && include,
      label: label.trim(),
      is_hidden: item?.is_hidden ?? false,
      target_label: picked?.target_label ?? builtinLabel ?? label.trim(),
      // The Storefront link and the reason it may be left out are the server's to say; they
      // come back with the next save.
      link: item?.link ?? null,
      not_shown_reason: item?.not_shown_reason ?? null,
      children: item?.children ?? [],
    });
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="space-y-1">
        <label htmlFor="menu-item-type" className="block font-medium">
          Hedef türü
        </label>
        <Select
          id="menu-item-type"
          value={type}
          disabled={item !== undefined}
          onChange={(e) => {
            setType(e.target.value as TargetType);
            setPicked(null);
          }}
        >
          {TARGET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        {item && <span className="block text-muted-foreground">Tür sonradan değiştirilemez.</span>}
      </div>

      {searchable && (
        <div className="space-y-1">
          <label htmlFor="menu-item-search" className="block font-medium">
            {typeLabel(type)} ara
          </label>
          <Input
            id="menu-item-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Adın bir kısmını yazın"
          />
          {picked && (
            <p className="text-muted-foreground">
              Seçili: <span className="font-medium text-foreground">{picked.target_label}</span>
            </p>
          )}
          <ul className="max-h-40 overflow-auto rounded-md border border-border">
            {matches.length === 0 ? (
              <li className="px-2 py-1 text-muted-foreground">Sonuç yok.</li>
            ) : (
              matches.map((t) => (
                <li
                  key={`${t.target_type}-${t.category_id ?? t.product_id ?? t.brand_id ?? t.collection_id ?? t.campaign_page_id ?? t.legal_page}`}
                >
                  <button
                    type="button"
                    className="w-full px-2 py-1 text-left hover:bg-muted"
                    onClick={() => setPicked(t)}
                  >
                    {t.target_label}
                  </button>
                </li>
              ))
            )}
          </ul>
          {errors.target && <span className="block text-red-700">{errors.target}</span>}
        </div>
      )}

      {type === "builtin" && (
        <div className="space-y-1">
          <label htmlFor="menu-item-builtin" className="block font-medium">
            Sayfa
          </label>
          <Select
            id="menu-item-builtin"
            value={builtin}
            onChange={(e) => setBuiltin(e.target.value)}
          >
            <option value="">Seçin</option>
            {BUILTIN_PAGES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          {errors.target && <span className="block text-red-700">{errors.target}</span>}
        </div>
      )}

      {type === "url" && (
        <div className="space-y-1">
          <label htmlFor="menu-item-url" className="block font-medium">
            Bağlantı
          </label>
          <Input
            id="menu-item-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/kampanyalar ya da https://..."
            aria-invalid={errors.url !== undefined}
          />
          <span className="block text-muted-foreground">
            '/' ile başlayan bir iç yol ya da https:// adresi. Dış adresler yeni sekmede açılır.
          </span>
          {errors.url && <span className="block text-red-700">{errors.url}</span>}
        </div>
      )}

      {type === "category" && (
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1"
            checked={include}
            onChange={(e) => setInclude(e.target.checked)}
          />
          <span>
            <span className="font-medium">Alt kategorileri otomatik ekle</span>
            <span className="block text-muted-foreground">
              Kategori ağacı değiştikçe menü kendiliğinden güncellenir.
            </span>
            {note && <span className="block text-amber-700">{note}</span>}
          </span>
        </label>
      )}

      <div className="space-y-1">
        <label htmlFor="menu-item-label" className="block font-medium">
          {type === "group" ? "Başlık" : "Ad (isteğe bağlı)"}
        </label>
        <Input
          id="menu-item-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          aria-invalid={errors.label !== undefined}
        />
        {errors.label ? (
          <span className="block text-red-700">{errors.label}</span>
        ) : (
          type !== "group" && (
            <span className="block text-muted-foreground">
              Boşsa hedefin adı kullanılır ve hedef yeniden adlandırılınca değişir.
            </span>
          )
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Vazgeç
        </Button>
        <Button type="submit" size="sm">
          {item ? "Tamam" : "Ekle"}
        </Button>
      </div>
    </form>
  );
}
