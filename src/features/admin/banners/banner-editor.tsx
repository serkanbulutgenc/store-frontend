import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import { can, type Me } from "@/lib/api/me";
import { formatDate } from "@/lib/format";
import { categoriesQuery } from "../catalog/queries";
import { useCrumbLabel } from "../components/crumb-labels";
import { ActionDialog } from "../forms/action-dialog";
import { type BannerOut, bannerQuery, IMAGE_TYPES, useBannerActions } from "./queries";
import {
  ALT_MAX,
  availableActions,
  type BannerAction,
  type BannerFields,
  changedFields,
  checkFields,
  completeness,
  editNote,
  editTarget,
  fromLocalInput,
  imageEditable,
  imageNote,
  isImageSlot,
  LINK_MAX,
  MESSAGE_MAX,
  POSITION_MAX,
  SLOT_KEYS,
  slotLabel,
  statusLabel,
  statusTone,
  toLocalInput,
} from "./rules";

const message = (e: unknown) =>
  e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.";

type Who = { owner: boolean; submitter: boolean };
type State = { status: never; hasPendingChange: boolean };

export function BannerEditor({ bannerId, me }: { bannerId: number; me: Me }) {
  const { data: banner } = useSuspenseQuery(bannerQuery(bannerId));
  useCrumbLabel(String(bannerId), banner.message || slotLabel(banner.slot));
  const actions = useBannerActions(bannerId);
  const [rejecting, setRejecting] = useState(false);

  const owner = can(me, "manage_banners");
  const who: Who = { owner, submitter: banner.submitted_by?.id === me.id };
  const state: State = {
    status: banner.status as never,
    hasPendingChange: banner.pending_change !== null,
  };
  const moves = availableActions(state, who);
  // The storefront hides a Banner that is incomplete, so say so before it goes for approval.
  const missing = completeness(banner);

  async function onMove(action: BannerAction) {
    if (action === "reject") return setRejecting(true);
    try {
      await actions.move({ action });
      toast.success(moves.find((m) => m.action === action)?.success ?? "Tamam.");
    } catch (e) {
      toast.error(message(e));
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold">{banner.message || slotLabel(banner.slot)}</h1>
          <Badge tone={statusTone(banner.status)}>{statusLabel(banner.status)}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{slotLabel(banner.slot)}</p>
        {banner.rejection_reason && banner.status === "draft" && (
          <p role="status" className="rounded-md bg-amber-100 p-2 text-sm text-amber-900">
            Reddedildi: {banner.rejection_reason}
          </p>
        )}
        {banner.status === "pending_approval" && banner.submitted_by && (
          <p className="text-sm text-muted-foreground">
            {banner.submitted_by.name} onaya gönderdi
            {banner.submitted_at ? ` (${formatDate(banner.submitted_at)})` : ""}.
          </p>
        )}
        {missing.length > 0 && banner.status !== "published" && (
          <p role="note" className="rounded-md bg-muted p-2 text-sm text-muted-foreground">
            Mağazada görünmesi için eksik: {missing.join(" ")}
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
              {banner.pending_change && (m.action === "approve" || m.action === "reject")
                ? `Değişikliği ${m.action === "approve" ? "onayla" : "reddet"}`
                : m.label}
            </Button>
          ))}
        </div>
      </div>

      {banner.pending_change && <PendingChange banner={banner} />}

      <FieldsForm
        key={JSON.stringify([
          banner.pending_change?.payload ?? null,
          banner.status,
          banner.updated_at,
        ])}
        banner={banner}
        who={who}
        state={state}
        save={actions.save}
      />

      {isImageSlot(banner.slot) && (
        <ImagesSection
          banner={banner}
          editable={imageEditable(state, who)}
          note={imageNote(state, who)}
        />
      )}

      <ActionDialog
        open={rejecting}
        title={banner.pending_change ? "Değişikliği reddet" : "Banner'ı reddet"}
        intro="Gerekçe, gönderen kişiye gösterilir. Boş bırakabilirsiniz."
        fields={[{ name: "reason", label: "Gerekçe" }]}
        defaults={{ reason: "" }}
        schema={z.object({ reason: z.string().max(500, "En fazla 500 karakter olabilir.") })}
        success="Reddedildi."
        submit={(v: { reason: string }) => actions.move({ action: "reject", reason: v.reason })}
        onClose={() => setRejecting(false)}
      />
    </div>
  );
}

const asFields = (b: BannerOut): BannerFields => ({
  slot: b.slot,
  message: b.message,
  link: b.link,
  position: b.position,
  starts_at: b.starts_at,
  ends_at: b.ends_at,
  category_id: b.category?.id ?? null,
});

const show = (field: keyof BannerFields, value: BannerFields[keyof BannerFields]) => {
  if (value === null || value === "") return "—";
  if (field === "slot") return slotLabel(String(value));
  if ((field === "starts_at" || field === "ends_at") && typeof value === "string")
    return formatDate(value);
  return String(value);
};

/** The Staff edit of a published Banner, waiting for the Owner. */
export function PendingChange({ banner }: { banner: BannerOut }) {
  const change = banner.pending_change;
  if (!change) return null;
  const rows = changedFields(asFields(banner), change.payload as Partial<BannerFields>);
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
        {rows.map((r) => (
          <div key={r.field}>
            <dt className="font-medium">{r.label}</dt>
            <dd className="text-muted-foreground line-through">{show(r.field, r.before)}</dd>
            <dd>{show(r.field, r.after)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Slot, message, link, order, dates and Category. Where a save goes depends on the Banner's
 * state and who is signed in (see `editTarget`). It starts from the pending change when there
 * is one, so Staff amend it rather than the live version. */
export function FieldsForm({
  banner,
  who,
  state,
  save,
}: {
  banner: BannerOut;
  who: Who;
  state: State;
  save: ReturnType<typeof useBannerActions>["save"];
}) {
  const source = {
    ...asFields(banner),
    ...(banner.pending_change?.payload as Partial<BannerFields>),
  };
  const ids = {
    slot: useId(),
    text: useId(),
    category: useId(),
    link: useId(),
    position: useId(),
    starts: useId(),
    ends: useId(),
  };
  const [slot, setSlot] = useState(source.slot);
  const [text, setText] = useState(source.message);
  const [categoryId, setCategoryId] = useState(
    source.category_id ? String(source.category_id) : "",
  );
  const [link, setLink] = useState(source.link);
  const [position, setPosition] = useState(String(source.position));
  const [starts, setStarts] = useState(toLocalInput(source.starts_at));
  const [ends, setEnds] = useState(toLocalInput(source.ends_at));
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const target = editTarget(state, who);
  const note = editNote(state, who);
  const readOnly = target === "none";
  const values = { slot, message: text, link, position, starts, ends };
  const errors = tried ? checkFields(values) : {};
  const { data: categories = [] } = useQuery({
    ...categoriesQuery,
    enabled: slot === "category_top",
  });

  async function submit() {
    setTried(true);
    if (Object.keys(checkFields(values)).length > 0) return;
    setError(null);
    setSaving(true);
    try {
      await save({
        slot,
        message: isImageSlot(slot) ? "" : text.trim(),
        category_id: slot === "category_top" && categoryId ? Number(categoryId) : null,
        link: link.trim(),
        position: Number(position),
        starts_at: fromLocalInput(starts),
        ends_at: fromLocalInput(ends),
      });
      toast.success(
        target === "pending-change" ? "Değişiklik onaya gönderildi." : "Banner kaydedildi.",
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      noValidate
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
          <label htmlFor={ids.slot} className="block font-medium">
            Alan
          </label>
          <Select
            id={ids.slot}
            className="w-64"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
          >
            {SLOT_KEYS.map((s) => (
              <option key={s} value={s}>
                {slotLabel(s)}
              </option>
            ))}
          </Select>
        </div>
        {!isImageSlot(slot) && (
          <div className="space-y-1">
            <label htmlFor={ids.text} className="block font-medium">
              Mesaj
            </label>
            <Input
              id={ids.text}
              value={text}
              maxLength={MESSAGE_MAX}
              aria-invalid={!!errors.message}
              onChange={(e) => setText(e.target.value)}
            />
            {errors.message && (
              <span role="alert" className="block text-red-700">
                {errors.message}
              </span>
            )}
          </div>
        )}
        {slot === "category_top" && (
          <div className="space-y-1">
            <label htmlFor={ids.category} className="block font-medium">
              Kategori
            </label>
            <Select
              id={ids.category}
              className="w-64"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Tüm kategoriler</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {`${"— ".repeat(c.depth)}${c.name}`}
                </option>
              ))}
            </Select>
            <span className="block text-xs text-muted-foreground">
              Boş bırakırsanız her kategori sayfasının üstünde görünür.
            </span>
          </div>
        )}
        <div className="space-y-1">
          <label htmlFor={ids.link} className="block font-medium">
            Bağlantı (isteğe bağlı)
          </label>
          <Input
            id={ids.link}
            value={link}
            maxLength={LINK_MAX}
            placeholder="/kampanyalar/yaz veya https://…"
            aria-invalid={!!errors.link}
            onChange={(e) => setLink(e.target.value)}
          />
          {errors.link && (
            <span role="alert" className="block text-red-700">
              {errors.link}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor={ids.position} className="block font-medium">
            Sıra
          </label>
          <Input
            id={ids.position}
            type="number"
            min={0}
            max={POSITION_MAX}
            className="w-32"
            value={position}
            aria-invalid={!!errors.position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <span className="block text-xs text-muted-foreground">
            Aynı alandaki banner'lar küçükten büyüğe gösterilir.
          </span>
          {errors.position && (
            <span role="alert" className="block text-red-700">
              {errors.position}
            </span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor={ids.starts} className="block font-medium">
              Başlangıç (isteğe bağlı)
            </label>
            <Input
              id={ids.starts}
              type="datetime-local"
              value={starts}
              onChange={(e) => setStarts(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={ids.ends} className="block font-medium">
              Bitiş (isteğe bağlı)
            </label>
            <Input
              id={ids.ends}
              type="datetime-local"
              value={ends}
              aria-invalid={!!errors.ends}
              onChange={(e) => setEnds(e.target.value)}
            />
            {errors.ends && (
              <span role="alert" className="block text-red-700">
                {errors.ends}
              </span>
            )}
          </div>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {!readOnly && (
        <Button type="submit" size="sm" disabled={saving}>
          {target === "pending-change" ? "Onaya gönder" : "Kaydet"}
        </Button>
      )}
    </form>
  );
}

/** The main and the mobile image, with the alt text that covers both. Their own endpoints,
 * apart from the fields: they are not part of a pending change. */
export function ImagesSection({
  banner,
  editable,
  note,
}: {
  banner: BannerOut;
  editable: boolean;
  note: string | null;
}) {
  const actions = useBannerActions(banner.id);
  const altId = useId();
  const mainId = useId();
  const mobileId = useId();
  const [alt, setAlt] = useState(banner.image?.alt_text ?? "");
  const [error, setError] = useState<string | null>(null);
  const [altError, setAltError] = useState<string | null>(null);

  async function attempt(work: () => Promise<unknown>, success?: string) {
    setError(null);
    try {
      await work();
      if (success) toast.success(success);
    } catch (e) {
      setError(message(e));
    }
  }
  function onFile(which: "image" | "mobile-image", file: File | undefined) {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type))
      return setError("Yalnızca JPEG, PNG veya WebP yüklenebilir.");
    if (which === "image" && !alt.trim()) {
      setAltError("Görsel için alternatif metin gerekli.");
      return;
    }
    setAltError(null);
    void attempt(() => actions.upload({ which, file, altText: alt.trim() }), "Görsel yüklendi.");
  }
  function saveAlt() {
    if (!alt.trim()) return setAltError("Görsel için alternatif metin gerekli.");
    setAltError(null);
    void attempt(() => actions.setAlt(alt.trim()), "Metin kaydedildi.");
  }

  const thumb = (image: BannerOut["image"]) => {
    const d = image?.derivatives.find((x) => x.width >= 400) ?? image?.derivatives[0];
    if (!image) return null;
    return d ? (
      <img src={d.url} alt="" className="h-20 w-32 rounded-md border object-cover" />
    ) : (
      <div className="flex h-20 w-32 items-center justify-center rounded-md border text-xs text-muted-foreground">
        {image.status === "failed" ? "İşlenemedi" : "İşleniyor…"}
      </div>
    );
  };

  return (
    <section aria-labelledby="images-title" className="space-y-3 text-sm">
      <h2 id="images-title" className="font-medium">
        Görseller
      </h2>
      {note && (
        <p role="note" className="rounded-md bg-muted p-2 text-muted-foreground">
          {note}
        </p>
      )}
      <fieldset disabled={!editable} className="space-y-3">
        <div className="space-y-1">
          <label htmlFor={altId} className="block font-medium">
            Alternatif metin
          </label>
          <div className="flex gap-2">
            <Input
              id={altId}
              value={alt}
              maxLength={ALT_MAX}
              aria-invalid={!!altError}
              onChange={(e) => setAlt(e.target.value)}
            />
            {banner.image && (
              <Button type="button" size="sm" variant="outline" onClick={saveAlt}>
                Metni kaydet
              </Button>
            )}
          </div>
          <span className="block text-xs text-muted-foreground">
            Her iki görsel için de kullanılır. Görsel yüklemek için gereklidir.
          </span>
          {altError && (
            <span role="alert" className="block text-red-700">
              {altError}
            </span>
          )}
        </div>
        <div className="space-y-2">
          <p className="font-medium">Ana görsel</p>
          {thumb(banner.image)}
          {banner.image?.status === "failed" && banner.image.error && (
            <p className="text-red-700">{banner.image.error}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={mainId}>{banner.image ? "Görseli değiştir" : "Görsel yükle"}</label>
            <input
              id={mainId}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              onChange={(e) => {
                onFile("image", e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {banner.image && (
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
        </div>
        <div className="space-y-2">
          <p className="font-medium">Mobil görsel (isteğe bağlı)</p>
          {thumb(banner.mobile_image)}
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={mobileId}>
              {banner.mobile_image ? "Mobil görseli değiştir" : "Mobil görsel yükle"}
            </label>
            <input
              id={mobileId}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              disabled={!banner.image}
              onChange={(e) => {
                onFile("mobile-image", e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {banner.mobile_image && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  void attempt(() => actions.removeMobile(), "Mobil görsel kaldırıldı.")
                }
              >
                Mobil görseli kaldır
              </Button>
            )}
          </div>
          {!banner.image && (
            <span className="block text-xs text-muted-foreground">Önce ana görseli yükleyin.</span>
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
