import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import { can, type Me } from "@/lib/api/me";
import { ConfirmDeleteDialog } from "../../components/delete-confirm";
import { validateFile } from "../../photos/rules";
import { uploadCategoryImage } from "../category-image";
import {
  buildTree,
  expandableIds,
  isEffectivelyHidden,
  type MoveBlock,
  moveTargets,
  siblingReorder,
  type TreeRow,
  visibleRows,
} from "../category-order";
import { type CategoryOut, categoriesQuery, keys } from "../queries";
import { CategoryRowActions } from "./category-row-actions";

const message = (e: unknown) =>
  e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.";

function useRefresh() {
  const qc = useQueryClient();
  // Products and stock rows embed category names.
  return () =>
    Promise.all(
      [keys.refs, keys.products, keys.stock].map((queryKey) => qc.invalidateQueries({ queryKey })),
    );
}

export function CategoriesScreen({ me }: { me: Me }) {
  const { data } = useSuspenseQuery(categoriesQuery);
  const canManage = can(me, "manage_categories");
  const canRestructure = can(me, "restructure_categories");
  const refresh = useRefresh();
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState<{ parentId: number | null } | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const rows = useMemo(() => visibleRows(buildTree(data), expanded), [data, expanded]);
  const find = (id: number | null) => data.find((c) => c.id === id) ?? null;
  const deleting = find(deletingId);
  const remove = useMutation({
    mutationFn: async () => {
      if (!deleting) return;
      await adminApi.DELETE("/api/admin/categories/{category_id}", {
        params: { path: { category_id: deleting.id } },
      });
    },
  });
  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  // Stay pending until the list shows the new state, so a quick second move is not
  // computed from the old one.
  const reorder = useMutation({
    mutationFn: async (v: { parent_id: number | null; ids: number[] }) => {
      await adminApi.POST("/api/admin/categories/reorder", { body: v });
      await refresh();
    },
    onError: (e) => toast.error(message(e)),
  });
  const toggleHidden = useMutation({
    mutationFn: async (c: CategoryOut) => {
      await adminApi.PATCH("/api/admin/categories/{category_id}", {
        params: { path: { category_id: c.id } },
        body: { is_hidden: !c.is_hidden },
      });
      await refresh();
    },
    onError: (e) => toast.error(message(e)),
  });
  const step = (id: number, delta: -1 | 1) => {
    const request = siblingReorder(data, id, delta);
    if (request) reorder.mutate(request);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Kategoriler</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setExpanded(expandableIds(data))}>
            Tümünü aç
          </Button>
          <Button size="sm" variant="outline" onClick={() => setExpanded(new Set())}>
            Tümünü kapat
          </Button>
          {canManage && (
            <Button size="sm" onClick={() => setCreating({ parentId: null })}>
              Yeni kategori
            </Button>
          )}
        </div>
      </div>
      {canManage && (
        <p className="text-sm text-muted-foreground">
          Sırayı değiştirmek için okları kullanın; sıra mağaza menüsüne hemen yansır. En fazla beş
          seviye.
        </p>
      )}
      <ul className="divide-y divide-border rounded-md border border-border bg-card">
        {rows.map((row) => (
          <TreeItem
            key={row.category.id}
            row={row}
            hidden={isEffectivelyHidden(row.category, data)}
            onToggle={toggle}
          >
            <CategoryRowActions
              row={row}
              canManage={canManage}
              canRestructure={canRestructure}
              busy={reorder.isPending}
              onAddChild={(id) => {
                setExpanded((prev) => new Set(prev).add(id));
                setCreating({ parentId: id });
              }}
              onEdit={setEditingId}
              onToggleHidden={(id) => {
                const c = find(id);
                if (c) toggleHidden.mutate(c);
              }}
              onMove={setMovingId}
              onDelete={setDeletingId}
              onUp={(id) => step(id, -1)}
              onDown={(id) => step(id, 1)}
            />
          </TreeItem>
        ))}
      </ul>
      <Dialog open={creating !== null} onClose={() => setCreating(null)} title="Yeni kategori">
        {creating && (
          <CreateForm all={data} parentId={creating.parentId} onClose={() => setCreating(null)} />
        )}
      </Dialog>
      <Dialog
        open={find(editingId) !== null}
        onClose={() => setEditingId(null)}
        title="Kategoriyi düzenle"
      >
        {find(editingId) && (
          <EditForm
            key={editingId}
            category={find(editingId) as CategoryOut}
            canManage={canManage}
            onClose={() => setEditingId(null)}
          />
        )}
      </Dialog>
      <Dialog
        open={find(movingId) !== null}
        onClose={() => setMovingId(null)}
        title="Kategoriyi taşı"
      >
        {find(movingId) && (
          <MoveForm
            key={movingId}
            all={data}
            category={find(movingId) as CategoryOut}
            onClose={() => setMovingId(null)}
          />
        )}
      </Dialog>
      <ConfirmDeleteDialog
        target={deleting && { key: deleting.id, name: deleting.name }}
        title="Kategoriyi sil"
        touches={
          deleting ? [`${deleting.product_count} ürün`, `${deleting.child_count} alt kategori`] : []
        }
        run={() => remove.mutateAsync()}
        onDeleted={refresh}
        success="Kategori silindi."
        onClose={() => setDeletingId(null)}
      />
    </div>
  );
}

function TreeItem({
  row,
  hidden,
  onToggle,
  children,
}: {
  row: TreeRow;
  hidden: boolean;
  onToggle: (id: number) => void;
  children: React.ReactNode;
}) {
  const c = row.category;
  const thumb = c.image?.derivatives.find((d) => d.width >= 400) ?? c.image?.derivatives[0];
  return (
    <li
      className="flex flex-wrap items-center gap-3 px-3 py-2"
      style={{ paddingLeft: `${0.75 + (row.depth - 1) * 1.5}rem` }}
    >
      {row.hasChildren ? (
        <button
          type="button"
          aria-expanded={row.expanded}
          aria-label={`${c.name} ${row.expanded ? "daralt" : "genişlet"}`}
          className="size-6 shrink-0 rounded text-muted-foreground hover:bg-accent"
          onClick={() => onToggle(c.id)}
        >
          {row.expanded ? "▾" : "▸"}
        </button>
      ) : (
        <span aria-hidden className="size-6 shrink-0" />
      )}
      {thumb ? (
        <img src={thumb.url} alt="" className="size-8 shrink-0 rounded border object-cover" />
      ) : (
        <span aria-hidden className="size-8 shrink-0 rounded border bg-muted" />
      )}
      <div className="min-w-0 flex-1">
        <span className="font-medium">{c.name}</span>{" "}
        <span className="font-mono text-xs text-muted-foreground">{c.slug}</span>{" "}
        {hidden && <Badge tone="warn">Gizli</Badge>}
        <span className="block text-xs text-muted-foreground">
          {c.product_count} ürün · {c.child_count} alt kategori
        </span>
      </div>
      {children}
    </li>
  );
}

const BLOCKED: Record<MoveBlock, string> = {
  self: "kendisi",
  descendant: "alt kategorisi",
  "too-deep": "en fazla beş seviye aşılır",
};

function MoveForm({
  all,
  category,
  onClose,
}: {
  all: CategoryOut[];
  category: CategoryOut;
  onClose: () => void;
}) {
  const refresh = useRefresh();
  const group = useId();
  const [target, setTarget] = useState<number | null>(category.parent_id);
  const [error, setError] = useState<string | null>(null);
  const targets = useMemo(() => moveTargets(all, category.id), [all, category.id]);
  const move = useMutation({
    mutationFn: async () => {
      await adminApi.POST("/api/admin/categories/{category_id}/move", {
        params: { path: { category_id: category.id } },
        body: { parent_id: target },
      });
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Kategori taşındı.");
      onClose();
    },
    onError: (e) => setError(message(e)),
  });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        move.mutate();
      }}
    >
      <p className="text-sm">
        <strong>{category.name}</strong> alt kategorileriyle birlikte taşınır ve yeni üst
        kategorisinin en sonuna eklenir.
      </p>
      <fieldset className="max-h-72 space-y-1 overflow-auto rounded-md border p-2 text-sm">
        <legend className="px-1 font-medium">Yeni üst kategori</legend>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={group}
            checked={target === null}
            onChange={() => setTarget(null)}
          />
          Ana kategori (en üst seviye)
        </label>
        {targets.map((t) => (
          <label
            key={t.category.id}
            className={`flex items-center gap-2 ${t.blocked ? "text-muted-foreground" : ""}`}
            style={{ paddingLeft: `${t.depth * 1.25}rem` }}
          >
            <input
              type="radio"
              name={group}
              disabled={t.blocked !== null}
              checked={target === t.category.id}
              onChange={() => setTarget(t.category.id)}
            />
            {t.category.name}
            {t.blocked && <span className="text-xs">({BLOCKED[t.blocked]})</span>}
          </label>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Vazgeç
        </Button>
        <Button type="submit" disabled={target === category.parent_id || move.isPending}>
          Taşı
        </Button>
      </div>
    </form>
  );
}

function CreateForm({
  all,
  parentId: initialParent,
  onClose,
}: {
  all: CategoryOut[];
  parentId: number | null;
  onClose: () => void;
}) {
  const refresh = useRefresh();
  const nameId = useId();
  const parentId = useId();
  const [name, setName] = useState("");
  const [parent, setParent] = useState(initialParent === null ? "" : String(initialParent));
  const [error, setError] = useState<string | null>(null);
  const options = useMemo(() => visibleRows(buildTree(all), expandableIds(all)), [all]);
  const create = useMutation({
    mutationFn: async () => {
      await adminApi.POST("/api/admin/categories", {
        body: { name: name.trim(), parent_id: parent ? Number(parent) : null },
      });
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Kategori eklendi.");
      onClose();
    },
    onError: (e) => setError(message(e)),
  });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        create.mutate();
      }}
    >
      <div className="space-y-1 text-sm">
        <label htmlFor={nameId} className="font-medium">
          Ad
        </label>
        <Input id={nameId} autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1 text-sm">
        <label htmlFor={parentId} className="font-medium">
          Üst kategori
        </label>
        <Select id={parentId} value={parent} onChange={(e) => setParent(e.target.value)}>
          <option value="">Ana kategori</option>
          {options.map((r) => (
            <option key={r.category.id} value={r.category.id} disabled={!r.canAddChild}>
              {"\u00a0\u00a0".repeat(r.depth - 1)}
              {r.category.name}
              {r.canAddChild ? "" : " (en fazla beş seviye)"}
            </option>
          ))}
        </Select>
        <span className="block text-xs text-muted-foreground">En fazla beş seviye.</span>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Vazgeç
        </Button>
        <Button type="submit" disabled={name.trim() === "" || create.isPending}>
          Ekle
        </Button>
      </div>
    </form>
  );
}

function EditForm({
  category,
  canManage,
  onClose,
}: {
  category: CategoryOut;
  canManage: boolean;
  onClose: () => void;
}) {
  const refresh = useRefresh();
  const ids = { name: useId(), desc: useId(), seoT: useId(), seoD: useId(), alt: useId() };
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);
  const [seoTitle, setSeoTitle] = useState(category.seo_title);
  const [seoDescription, setSeoDescription] = useState(category.seo_description);
  const [hidden, setHidden] = useState(category.is_hidden);
  const [alt, setAlt] = useState(category.image?.alt_text ?? "");
  const [error, setError] = useState<string | null>(null);
  const image = category.image;

  const save = useMutation({
    mutationFn: async () => {
      await adminApi.PATCH("/api/admin/categories/{category_id}", {
        params: { path: { category_id: category.id } },
        body: {
          name: name.trim(),
          description,
          seo_title: seoTitle,
          seo_description: seoDescription,
          is_hidden: hidden,
          ...(image ? { image_alt: alt } : {}),
        },
      });
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Kategori kaydedildi.");
      onClose();
    },
    onError: (e) => setError(message(e)),
  });
  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw new Error("Yalnızca JPEG, PNG veya WebP yüklenebilir.");
      const problem = validateFile(file);
      if (problem) throw new Error(problem);
      await uploadCategoryImage(category.id, file);
      setAlt(""); // the old text described the old picture
    },
    onSuccess: refresh,
    onError: (e) =>
      setError(e instanceof Error && !(e instanceof ApiError) ? e.message : message(e)),
  });
  const removeImage = useMutation({
    mutationFn: async () => {
      await adminApi.DELETE("/api/admin/categories/{category_id}/image", {
        params: { path: { category_id: category.id } },
      });
      setAlt("");
    },
    onSuccess: refresh,
    onError: (e) => setError(message(e)),
  });
  const thumb = image?.derivatives.find((d) => d.width >= 400) ?? image?.derivatives[0];

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        save.mutate();
      }}
    >
      <fieldset disabled={!canManage} className="space-y-3">
        <div className="space-y-1 text-sm">
          <label htmlFor={ids.name} className="font-medium">
            Ad
          </label>
          <Input id={ids.name} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1 text-sm">
          <label htmlFor={ids.desc} className="font-medium">
            Açıklama
          </label>
          <Textarea
            id={ids.desc}
            rows={4}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <span className="block text-xs text-muted-foreground">
            Kategori sayfasının üstünde görünür.
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <label htmlFor={ids.seoT} className="font-medium">
            SEO başlığı
          </label>
          <Input
            id={ids.seoT}
            maxLength={70}
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
          />
          <span className="block text-xs text-muted-foreground">
            {seoTitle.length}/70 · Boşsa kategori adı kullanılır.
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <label htmlFor={ids.seoD} className="font-medium">
            SEO açıklaması
          </label>
          <Textarea
            id={ids.seoD}
            rows={2}
            maxLength={160}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
          />
          <span className="block text-xs text-muted-foreground">
            {seoDescription.length}/160 · Arama sonuçlarında görünen özet.
          </span>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={hidden}
            onChange={(e) => setHidden(e.target.checked)}
          />
          <span>
            <span className="font-medium">Mağazada gizle</span>
            <span className="block text-xs text-muted-foreground">
              Kategori ve alt kategorileri menüden, listelerden ve site haritasından kalkar; adresi
              404 verir. Başka görünür kategoride de olan ürünler görünmeye devam eder.
            </span>
          </span>
        </label>
        <div className="space-y-2 text-sm">
          <span className="font-medium">Görsel</span>
          {image ? (
            <div className="flex items-start gap-3">
              {thumb ? (
                <img src={thumb.url} alt="" className="h-20 w-32 rounded-md border object-cover" />
              ) : (
                <div className="flex h-20 w-32 items-center justify-center rounded-md border text-xs text-muted-foreground">
                  {image.status === "failed" ? "İşlenemedi" : "İşleniyor…"}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <label htmlFor={ids.alt} className="font-medium">
                  Alternatif metin
                </label>
                <Input
                  id={ids.alt}
                  maxLength={255}
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                />
                <span className="block text-xs text-muted-foreground">Boşsa kategori adı.</span>
                {image.status === "failed" && (
                  <p role="alert" className="text-xs text-destructive">
                    Görsel işlenemedi; başka bir dosya yükleyin.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Henüz görsel yok.</p>
          )}
          <div className="flex gap-2">
            <label className="inline-flex cursor-pointer items-center rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent">
              {image ? "Değiştir" : "Görsel yükle"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={upload.isPending || !canManage}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) {
                    setError(null);
                    upload.mutate(file);
                  }
                }}
              />
            </label>
            {image && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={removeImage.isPending}
                onClick={() => removeImage.mutate()}
              >
                Kaldır
              </Button>
            )}
          </div>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {canManage ? "Vazgeç" : "Kapat"}
        </Button>
        {canManage && (
          <Button type="submit" disabled={name.trim() === "" || save.isPending}>
            Kaydet
          </Button>
        )}
      </div>
    </form>
  );
}
