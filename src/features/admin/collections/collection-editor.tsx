import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import { can, type Me } from "@/lib/api/me";
import { formatDate } from "@/lib/format";
import { showsRejection } from "../approvals/rules";
import { productsQuery } from "../catalog/queries";
import { useCrumbLabel } from "../components/crumb-labels";
import { ConfirmDeleteDialog } from "../components/delete-confirm";
import { ActionDialog } from "../forms/action-dialog";
import { type CollectionOut, collectionQuery, IMAGE_TYPES, useCollectionActions } from "./queries";
import {
  availableActions,
  type CollectionAction,
  collectionStatusLabel,
  collectionStatusTone,
  editNote,
  editTarget,
  emptyWarning,
  imageEditable,
  imageNote,
  move,
} from "./rules";

const message = (e: unknown) =>
  e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.";

type Item = CollectionOut["products"][number];

export function CollectionEditor({ collectionId, me }: { collectionId: number; me: Me }) {
  const { data: c } = useSuspenseQuery(collectionQuery(collectionId));
  useCrumbLabel(String(collectionId), c.name);
  const navigate = useNavigate();
  const actions = useCollectionActions(collectionId);
  const [rejecting, setRejecting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const owner = can(me, "manage_collections");
  const who = { owner, submitter: c.submitted_by?.id === me.id };
  const state = { status: c.status, hasPendingChange: c.pending_change !== null };
  const moves = availableActions(state, who);
  const warning = emptyWarning(moves, (c.pending_change ?? c).products);

  async function run(action: CollectionAction, reason?: string) {
    await actions.move({ action, reason });
  }
  async function onMove(action: CollectionAction) {
    if (action === "reject") return setRejecting(true);
    try {
      await run(action);
      toast.success(moves.find((m) => m.action === action)?.success ?? "Tamam.");
    } catch (e) {
      toast.error(message(e));
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold">{c.name}</h1>
          <Badge tone={collectionStatusTone(c.status)}>{collectionStatusLabel(c.status)}</Badge>
        </div>
        {c.status === "published" && (
          <Link
            to="/collections/$slug"
            params={{ slug: c.slug }}
            className="text-sm underline-offset-2 hover:underline"
          >
            Mağazada gör
          </Link>
        )}
        {showsRejection(c) && (
          <p role="status" className="rounded-md bg-amber-100 p-2 text-sm text-amber-900">
            Reddedildi: {c.rejection_reason}
          </p>
        )}
        {c.status === "pending_approval" && c.submitted_by && (
          <p className="text-sm text-muted-foreground">
            {c.submitted_by.name} onaya gönderdi
            {c.submitted_at ? ` (${formatDate(c.submitted_at)})` : ""}.
          </p>
        )}
        {warning && (
          <p role="alert" className="rounded-md bg-amber-100 p-2 text-sm text-amber-900">
            {warning}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {moves.map((m) => (
            <Button
              key={m.action}
              size="sm"
              variant={m.primary ? "default" : "outline"}
              onClick={() => void onMove(m.action)}
            >
              {c.pending_change && (m.action === "approve" || m.action === "reject")
                ? `Değişikliği ${m.action === "approve" ? "onayla" : "reddet"}`
                : m.label}
            </Button>
          ))}
          {can(me, "delete_catalogue") && (
            <Button size="sm" variant="outline" onClick={() => setDeleting(true)}>
              Sil
            </Button>
          )}
        </div>
      </div>

      {c.pending_change && <PendingChange c={c} />}

      <FieldsForm
        key={JSON.stringify([c.pending_change ?? c, c.status])}
        c={c}
        who={who}
        state={state}
        save={actions.save}
      />

      <ImageSection c={c} editable={imageEditable(state, who)} note={imageNote(state, who)} />

      <ActionDialog
        open={rejecting}
        title={c.pending_change ? "Değişikliği reddet" : "Koleksiyonu reddet"}
        intro="Gerekçe, gönderen kişiye gösterilir. Boş bırakabilirsiniz."
        fields={[{ name: "reason", label: "Gerekçe" }]}
        defaults={{ reason: "" }}
        schema={z.object({ reason: z.string().max(500, "En fazla 500 karakter olabilir.") })}
        success="Reddedildi."
        submit={(v: { reason: string }) => run("reject", v.reason)}
        onClose={() => setRejecting(false)}
      />
      <ConfirmDeleteDialog
        target={deleting ? { key: c.id, name: c.name } : null}
        title="Koleksiyonu sil"
        touches={[]}
        run={async () => {
          await actions.remove();
          await navigate({ to: "/admin/collections" });
        }}
        alternative={
          c.status === "published" && !c.pending_change && owner
            ? {
                label: "Yayından kaldır",
                run: () => actions.move({ action: "unpublish" }),
                success: "Koleksiyon yayından kaldırıldı.",
              }
            : undefined
        }
        onClose={() => setDeleting(false)}
      />
    </div>
  );
}

/** The Staff edit of a published Collection, waiting for the Owner. */
function PendingChange({ c }: { c: CollectionOut }) {
  const change = c.pending_change;
  if (!change) return null;
  const rows: [string, string, string][] = [
    ["Ad", c.name, change.name],
    ["Adres", c.slug, change.slug],
    ["Açıklama", c.description, change.description],
    [
      "Ürünler",
      c.products.map((p) => p.title).join(", "),
      change.products.map((p) => p.title).join(", "),
    ],
  ];
  return (
    <section
      aria-labelledby="pending-title"
      className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm"
    >
      <h2 id="pending-title" className="font-medium">
        Bekleyen değişiklik
      </h2>
      <p className="text-muted-foreground">
        {change.submitted_by?.name ?? "Personel"} gönderdi ({formatDate(change.updated_at)}). Onaya
        kadar yayında olan sürüm görünür.
      </p>
      <dl className="space-y-1">
        {rows
          .filter(([, before, after]) => before !== after)
          .map(([label, before, after]) => (
            <div key={label}>
              <dt className="font-medium">{label}</dt>
              <dd className="text-muted-foreground line-through">{before || "—"}</dd>
              <dd>{after || "—"}</dd>
            </div>
          ))}
      </dl>
    </section>
  );
}

/** Name, address, description and the ordered Products. What it saves, and where, depends on
 * the Collection's state and who is signed in (see `editTarget`). It starts from the pending
 * change when there is one, so Staff and the Owner amend it rather than the live version. */
function FieldsForm({
  c,
  who,
  state,
  save,
}: {
  c: CollectionOut;
  who: { owner: boolean; submitter: boolean };
  state: { status: CollectionOut["status"]; hasPendingChange: boolean };
  save: ReturnType<typeof useCollectionActions>["save"];
}) {
  const source = c.pending_change ?? c;
  const ids = { name: useId(), slug: useId(), desc: useId() };
  const [name, setName] = useState(source.name);
  const [slug, setSlug] = useState(source.slug);
  const [description, setDescription] = useState(source.description);
  const [items, setItems] = useState<Item[]>(source.products);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const target = editTarget(state, who);
  const note = editNote(state, who);
  const readOnly = target === "none";

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      await save({
        // Staff always PATCH the Collection (the API stages it); only the Owner amends the change.
        toChange: who.owner && target === "pending-change",
        body: { name, slug, description, product_ids: items.map((i) => i.id) },
      });
      toast.success(
        target === "pending-change" && !who.owner
          ? "Değişiklik onaya gönderildi."
          : "Koleksiyon kaydedildi.",
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="space-y-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {note && (
        <p role="note" className="rounded-md bg-muted p-2 text-muted-foreground">
          {note}
        </p>
      )}
      <fieldset disabled={readOnly || saving} className="space-y-3">
        <div className="space-y-1">
          <label htmlFor={ids.name} className="block font-medium">
            Ad
          </label>
          <Input
            id={ids.name}
            value={name}
            maxLength={200}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={ids.slug} className="block font-medium">
            Adres
          </label>
          <Input id={ids.slug} value={slug} onChange={(e) => setSlug(e.target.value)} />
          <span className="block text-xs text-muted-foreground">/collections/{slug}</span>
        </div>
        <div className="space-y-1">
          <label htmlFor={ids.desc} className="block font-medium">
            Açıklama
          </label>
          <Textarea
            id={ids.desc}
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <ProductList items={items} onChange={setItems} />
      </fieldset>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {!readOnly && (
        <Button type="submit" size="sm" disabled={saving}>
          {target === "pending-change" && !who.owner ? "Onaya gönder" : "Kaydet"}
        </Button>
      )}
    </form>
  );
}

/** The Products in the Owner's order, with a search to add more. A Product that is not
 * published stays in the list but the Storefront page leaves it out. */
function ProductList({ items, onChange }: { items: Item[]; onChange: (next: Item[]) => void }) {
  const [q, setQ] = useState("");
  const searchId = useId();
  const term = q.trim();
  const { data } = useQuery({
    ...productsQuery({ page: 1, size: 10, q: term }),
    enabled: term.length >= 2,
  });
  const taken = new Set(items.map((i) => i.id));
  const matches = (data?.items ?? []).filter((p) => !taken.has(p.id));
  return (
    <div className="space-y-2">
      <span className="block font-medium">Ürünler ({items.length})</span>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Henüz ürün yok.</p>
      ) : (
        <SortableProducts items={items} onChange={onChange} />
      )}
      <div className="space-y-1">
        <label htmlFor={searchId} className="block font-medium">
          Ürün ekle
        </label>
        <Input
          id={searchId}
          type="search"
          placeholder="Ürün adı veya kodu (en az 2 harf)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {term.length >= 2 && data && matches.length === 0 && (
          <p className="text-muted-foreground">Eşleşen ürün yok.</p>
        )}
        {matches.length > 0 && (
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {matches.map((p) => (
              <li key={p.id} className="flex items-center gap-2 px-3 py-1.5">
                <span className="min-w-0 flex-1 truncate">{p.title}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={`${p.title} ekle`}
                  onClick={() => {
                    onChange([
                      ...items,
                      { id: p.id, title: p.title, slug: p.slug, status: p.status },
                    ]);
                    setQ("");
                  }}
                >
                  Ekle
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** The Products as a list that can be dragged (mouse, touch or keyboard: Space, arrows, Space)
 * as well as stepped with the up and down buttons. */
function SortableProducts({
  items,
  onChange,
}: {
  items: Item[];
  onChange: (next: Item[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const title = (id: unknown) => items.find((p) => p.id === Number(id))?.title ?? "";
  const position = (id: unknown) => items.findIndex((p) => p.id === Number(id)) + 1;
  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((p) => p.id === Number(active.id));
    const to = items.findIndex((p) => p.id === Number(over.id));
    if (from >= 0 && to >= 0) onChange(arrayMove(items, from, to));
  }
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Ürünü tutmak için Boşluk veya Enter'a basın. Yukarı ve aşağı oklarla taşıyın, bırakmak için tekrar Boşluk veya Enter, vazgeçmek için Escape'e basın.",
        },
        announcements: {
          onDragStart: ({ active }) => `${title(active.id)} tutuldu.`,
          onDragOver: ({ active, over }) =>
            over ? `${title(active.id)}, ${position(over.id)}. sıraya taşınacak.` : "",
          onDragEnd: ({ active, over }) =>
            over
              ? `${title(active.id)}, ${position(over.id)}. sıraya bırakıldı.`
              : `${title(active.id)} bırakılmadı.`,
          onDragCancel: ({ active }) => `${title(active.id)} için taşıma iptal edildi.`,
        },
      }}
    >
      <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <ol className="divide-y divide-border rounded-md border border-border bg-card">
          {items.map((p, i) => (
            <SortableRow key={p.id} product={p} index={i} items={items} onChange={onChange} />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  product: p,
  index: i,
  items,
  onChange,
}: {
  product: Item;
  index: number;
  items: Item[];
  onChange: (next: Item[]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: p.id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 bg-card px-3 py-1.5 ${isDragging ? "relative z-10 shadow-md" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`${p.title} sürükle`}
        className="size-6 shrink-0 cursor-grab touch-none rounded text-muted-foreground hover:bg-accent focus-visible:outline-2"
      >
        ⠿
      </button>
      <span className="w-6 text-muted-foreground">{i + 1}</span>
      <span className="min-w-0 flex-1 truncate">{p.title}</span>
      {p.status !== "published" && (
        <Badge tone="warn">{p.status === "draft" ? "Taslak" : "Arşivde"} · mağazada görünmez</Badge>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label={`${p.title} yukarı taşı`}
        disabled={i === 0}
        onClick={() => onChange(move(items, i, -1))}
      >
        <ArrowUp aria-hidden className="size-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label={`${p.title} aşağı taşı`}
        disabled={i === items.length - 1}
        onClick={() => onChange(move(items, i, 1))}
      >
        <ArrowDown aria-hidden className="size-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label={`${p.title} kaldır`}
        onClick={() => onChange(items.filter((x) => x.id !== p.id))}
      >
        <X aria-hidden className="size-4" />
      </Button>
    </li>
  );
}

/** The cover image. Its own endpoints, apart from the fields: it is not part of a pending change. */
function ImageSection({
  c,
  editable,
  note,
}: {
  c: CollectionOut;
  editable: boolean;
  note: string | null;
}) {
  const actions = useCollectionActions(c.id);
  const altId = useId();
  const fileId = useId();
  const image = c.image;
  const [alt, setAlt] = useState(image?.alt_text ?? "");
  const [error, setError] = useState<string | null>(null);
  const thumb = image?.derivatives.find((d) => d.width >= 400) ?? image?.derivatives[0];

  async function attempt(work: () => Promise<unknown>, success?: string) {
    setError(null);
    try {
      await work();
      if (success) toast.success(success);
    } catch (e) {
      setError(message(e));
    }
  }
  function onFile(file: File | undefined) {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type))
      return setError("Yalnızca JPEG, PNG veya WebP yüklenebilir.");
    void attempt(() => actions.upload({ file, altText: alt }), "Görsel yüklendi.");
  }

  return (
    <section aria-labelledby="cover-title" className="space-y-2 text-sm">
      <h2 id="cover-title" className="font-medium">
        Kapak görseli
      </h2>
      {note && (
        <p role="note" className="rounded-md bg-muted p-2 text-muted-foreground">
          {note}
        </p>
      )}
      {image && (
        <div className="flex items-start gap-3">
          {thumb ? (
            <img src={thumb.url} alt="" className="h-20 w-32 rounded-md border object-cover" />
          ) : (
            <div className="flex h-20 w-32 items-center justify-center rounded-md border text-xs text-muted-foreground">
              {image.status === "failed" ? "İşlenemedi" : "İşleniyor…"}
            </div>
          )}
          {image.status === "failed" && image.error && (
            <p className="text-red-700">{image.error}</p>
          )}
        </div>
      )}
      <fieldset disabled={!editable} className="space-y-2">
        <div className="space-y-1">
          <label htmlFor={altId} className="block font-medium">
            Alternatif metin
          </label>
          <div className="flex gap-2">
            <Input
              id={altId}
              value={alt}
              maxLength={255}
              onChange={(e) => setAlt(e.target.value)}
            />
            {image && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void attempt(() => actions.setAlt(alt), "Metin kaydedildi.")}
              >
                Metni kaydet
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={fileId} className="font-medium">
            {image ? "Görseli değiştir" : "Görsel yükle"}
          </label>
          <input
            id={fileId}
            type="file"
            accept={IMAGE_TYPES.join(",")}
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {image && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void attempt(() => actions.removeImage(), "Görsel kaldırıldı.");
                setAlt("");
              }}
            >
              Görseli kaldır
            </Button>
          )}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
