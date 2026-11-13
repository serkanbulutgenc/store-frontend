import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
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
import { validateFile } from "../../photos/rules";
import { uploadCategoryImage } from "../category-image";
import {
  type CategoryGroup,
  categoryGroups,
  isEffectivelyHidden,
  reorderedIds,
} from "../category-order";
import { type CategoryOut, categoriesQuery, keys } from "../queries";

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
  const refresh = useRefresh();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const reorder = useMutation({
    mutationFn: async (v: { parent_id: number | null; ids: number[] }) => {
      await adminApi.POST("/api/admin/categories/reorder", { body: v });
      // Stay pending until the list shows the new order, so a quick second move is not
      // computed from the old one.
      await refresh();
    },
    onError: (e) => toast.error(message(e)),
  });
  const editing = data.find((c) => c.id === editingId) ?? null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Kategoriler</h1>
        {canManage && (
          <Button size="sm" onClick={() => setCreating(true)}>
            Yeni kategori
          </Button>
        )}
      </div>
      {canManage && (
        <p className="text-sm text-muted-foreground">
          Sırayı değiştirmek için satırı sürükleyin veya okları kullanın; sıra mağaza menüsüne hemen
          yansır.
        </p>
      )}
      {categoryGroups(data).map((group) => (
        <GroupList
          key={group.parent?.id ?? "root"}
          group={group}
          all={data}
          canManage={canManage}
          busy={reorder.isPending}
          onMove={(from, to) =>
            reorder.mutate({
              parent_id: group.parent?.id ?? null,
              ids: reorderedIds(group.items, from, to),
            })
          }
          onEdit={setEditingId}
        />
      ))}
      <Dialog open={creating} onClose={() => setCreating(false)} title="Yeni kategori">
        {creating && <CreateForm all={data} onClose={() => setCreating(false)} />}
      </Dialog>
      <Dialog open={editing !== null} onClose={() => setEditingId(null)} title="Kategoriyi düzenle">
        {editing && (
          <EditForm
            key={editing.id}
            category={editing}
            canManage={canManage}
            onClose={() => setEditingId(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

function GroupList({
  group,
  all,
  canManage,
  busy,
  onMove,
  onEdit,
}: {
  group: CategoryGroup;
  all: CategoryOut[];
  canManage: boolean;
  busy: boolean;
  onMove: (from: number, to: number) => void;
  onEdit: (id: number) => void;
}) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const draggable = canManage && !busy && group.items.length > 1;
  return (
    <section className="space-y-1">
      <h2 className="text-sm font-medium text-muted-foreground">
        {group.parent ? `${group.parent.name} altında` : "Ana kategoriler"}
      </h2>
      <ul className="divide-y divide-border rounded-md border border-border bg-card">
        {group.items.map((c, i) => (
          <li
            key={c.id}
            draggable={draggable}
            onDragStart={() => setDragFrom(i)}
            onDragOver={(e) => draggable && dragFrom !== null && e.preventDefault()}
            onDrop={() => {
              if (dragFrom !== null && dragFrom !== i) onMove(dragFrom, i);
              setDragFrom(null);
            }}
            onDragEnd={() => setDragFrom(null)}
            className="flex items-center gap-3 px-3 py-2"
          >
            {draggable && (
              <span aria-hidden className="cursor-grab text-muted-foreground">
                ⋮⋮
              </span>
            )}
            <div className="min-w-0 flex-1">
              <span className="font-medium">{c.name}</span>{" "}
              <span className="font-mono text-xs text-muted-foreground">{c.slug}</span>{" "}
              {isEffectivelyHidden(c, all) && <Badge tone="warn">Gizli</Badge>}
            </div>
            {draggable && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={`${c.name} yukarı taşı`}
                  disabled={i === 0}
                  onClick={() => onMove(i, i - 1)}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={`${c.name} aşağı taşı`}
                  disabled={i === group.items.length - 1}
                  onClick={() => onMove(i, i + 1)}
                >
                  ↓
                </Button>
              </div>
            )}
            <Button size="sm" variant="outline" onClick={() => onEdit(c.id)}>
              {canManage ? "Düzenle" : "Göster"}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CreateForm({ all, onClose }: { all: CategoryOut[]; onClose: () => void }) {
  const refresh = useRefresh();
  const nameId = useId();
  const parentId = useId();
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const [error, setError] = useState<string | null>(null);
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
          {all
            .filter((c) => c.parent_id == null)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </Select>
        <span className="block text-xs text-muted-foreground">En fazla iki seviye.</span>
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
