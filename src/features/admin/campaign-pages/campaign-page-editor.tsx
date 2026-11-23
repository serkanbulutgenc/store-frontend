import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/features/legal/markdown";
import { ApiError } from "@/lib/api/errors";
import { can, type Me } from "@/lib/api/me";
import { formatDate } from "@/lib/format";
import { useCrumbLabel } from "../components/crumb-labels";
import { ActionDialog } from "../forms/action-dialog";
import {
  IMAGE_TYPES,
  linkableCampaignsQuery,
  type PageOut,
  pageQuery,
  usePageActions,
} from "./queries";
import {
  availableActions,
  changedFields,
  checkFields,
  DESCRIPTION_MAX,
  editNote,
  editTarget,
  fromLocalInput,
  imageEditable,
  imageNote,
  type PageAction,
  type PageFields,
  pageStatusLabel,
  pageStatusTone,
  TITLE_MAX,
  toLocalInput,
} from "./rules";

const message = (e: unknown) =>
  e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.";

export function CampaignPageEditor({ pageId, me }: { pageId: number; me: Me }) {
  const { data: page } = useSuspenseQuery(pageQuery(pageId));
  useCrumbLabel(String(pageId), page.title);
  const actions = usePageActions(pageId);
  const [rejecting, setRejecting] = useState(false);

  const owner = can(me, "manage_campaign_pages");
  const who = { owner, submitter: page.submitted_by?.id === me.id };
  const state = { status: page.status as never, hasPendingChange: page.pending_change !== null };
  const moves = availableActions(state, who);

  async function onMove(action: PageAction) {
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
          <h1 className="text-lg font-semibold">{page.title}</h1>
          <Badge tone={pageStatusTone(page.status)}>{pageStatusLabel(page.status)}</Badge>
        </div>
        {page.status === "published" && (
          <a
            href={`/kampanyalar/${page.slug}`}
            className="text-sm underline-offset-2 hover:underline"
          >
            Mağazada gör
          </a>
        )}
        {page.rejection_reason && page.status === "draft" && (
          <p role="status" className="rounded-md bg-amber-100 p-2 text-sm text-amber-900">
            Reddedildi: {page.rejection_reason}
          </p>
        )}
        {page.status === "pending_approval" && page.submitted_by && (
          <p className="text-sm text-muted-foreground">
            {page.submitted_by.name} onaya gönderdi
            {page.submitted_at ? ` (${formatDate(page.submitted_at)})` : ""}.
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
              {page.pending_change && (m.action === "approve" || m.action === "reject")
                ? `Değişikliği ${m.action === "approve" ? "onayla" : "reddet"}`
                : m.label}
            </Button>
          ))}
        </div>
      </div>

      {page.pending_change && <PendingChange page={page} />}

      <FieldsForm
        key={JSON.stringify([page.pending_change?.payload ?? null, page.status, page.updated_at])}
        page={page}
        who={who}
        state={state}
        save={actions.save}
      />

      <CoverSection page={page} editable={imageEditable(state, who)} note={imageNote(state, who)} />

      <CampaignLink page={page} owner={owner} link={actions.link} />

      <ActionDialog
        open={rejecting}
        title={page.pending_change ? "Değişikliği reddet" : "Sayfayı reddet"}
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

const asFields = (page: PageOut): PageFields => ({
  title: page.title,
  slug: page.slug,
  description: page.description,
  starts_at: page.starts_at,
  ends_at: page.ends_at,
});

const show = (field: keyof PageFields, value: string | null) =>
  value && (field === "starts_at" || field === "ends_at") ? formatDate(value) : value || "—";

/** The Staff edit of a published page, waiting for the Owner. */
export function PendingChange({ page }: { page: PageOut }) {
  const change = page.pending_change;
  if (!change) return null;
  const rows = changedFields(asFields(page), change.payload as Partial<PageFields>);
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

/** Title, address, Markdown text with a live preview, and the dates. Where a save goes
 * depends on the page's state and who is signed in (see `editTarget`). It starts from the
 * pending change when there is one, so Staff amend it rather than the live version. */
export function FieldsForm({
  page,
  who,
  state,
  save,
}: {
  page: PageOut;
  who: { owner: boolean; submitter: boolean };
  state: { status: never; hasPendingChange: boolean };
  save: ReturnType<typeof usePageActions>["save"];
}) {
  const source = { ...asFields(page), ...(page.pending_change?.payload as Partial<PageFields>) };
  const ids = {
    title: useId(),
    slug: useId(),
    text: useId(),
    starts: useId(),
    ends: useId(),
  };
  const [title, setTitle] = useState(source.title);
  const [slug, setSlug] = useState(source.slug);
  const [description, setDescription] = useState(source.description);
  const [starts, setStarts] = useState(toLocalInput(source.starts_at));
  const [ends, setEnds] = useState(toLocalInput(source.ends_at));
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const target = editTarget(state, who);
  const note = editNote(state, who);
  const readOnly = target === "none";
  const errors = tried ? checkFields({ title, description, starts, ends }) : {};

  async function submit() {
    setTried(true);
    if (Object.keys(checkFields({ title, description, starts, ends })).length > 0) return;
    setError(null);
    setSaving(true);
    try {
      await save({
        title,
        slug,
        description,
        starts_at: fromLocalInput(starts),
        ends_at: fromLocalInput(ends),
      });
      toast.success(
        target === "pending-change" ? "Değişiklik onaya gönderildi." : "Sayfa kaydedildi.",
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
          <label htmlFor={ids.title} className="block font-medium">
            Başlık
          </label>
          <Input
            id={ids.title}
            value={title}
            maxLength={TITLE_MAX}
            aria-invalid={!!errors.title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {errors.title && (
            <span role="alert" className="block text-red-700">
              {errors.title}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor={ids.slug} className="block font-medium">
            Adres
          </label>
          <Input id={ids.slug} value={slug} onChange={(e) => setSlug(e.target.value)} />
          <span className="block text-xs text-muted-foreground">/kampanyalar/{slug}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor={ids.text} className="block font-medium">
              Metin (Markdown)
            </label>
            <Textarea
              id={ids.text}
              rows={14}
              className="font-mono text-xs"
              maxLength={DESCRIPTION_MAX}
              aria-invalid={!!errors.description}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <span className="block text-xs text-muted-foreground">
              Başlık için #, liste için -, kalın için **metin**, bağlantı için [metin](/adres).
            </span>
            {errors.description && (
              <span role="alert" className="block text-red-700">
                {errors.description}
              </span>
            )}
          </div>
          <section aria-label="Önizleme" className="space-y-1">
            <h2 className="font-medium">Önizleme</h2>
            <div className="min-h-24 rounded-md border p-3">
              {description.trim() ? (
                <Markdown source={description} />
              ) : (
                <p className="text-muted-foreground">Metin yazınca burada görünür.</p>
              )}
            </div>
          </section>
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

/** The cover image. Its own endpoints, apart from the fields: it is not part of a pending change. */
export function CoverSection({
  page,
  editable,
  note,
}: {
  page: PageOut;
  editable: boolean;
  note: string | null;
}) {
  const actions = usePageActions(page.id);
  const altId = useId();
  const fileId = useId();
  const image = page.image;
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

/** The discount Campaign the page promotes. Only the Owner links or unlinks it; Staff see it. */
export function CampaignLink({
  page,
  owner,
  link,
}: {
  page: PageOut;
  owner: boolean;
  link: ReturnType<typeof usePageActions>["link"];
}) {
  const selectId = useId();
  const { data: campaigns = [] } = useQuery({ ...linkableCampaignsQuery(), enabled: owner });
  const [chosen, setChosen] = useState(page.campaign ? String(page.campaign.id) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const current = page.campaign ? String(page.campaign.id) : "";

  async function apply(next: number | null) {
    setError(null);
    setSaving(true);
    try {
      await link(next);
      toast.success(next === null ? "Kampanya bağlantısı kaldırıldı." : "Kampanya bağlandı.");
    } catch (e) {
      setError(message(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="link-title" className="space-y-2 text-sm">
      <h2 id="link-title" className="font-medium">
        İndirim kampanyası
      </h2>
      {!owner ? (
        <p className="text-muted-foreground">
          {page.campaign
            ? `Bağlı kampanya: ${page.campaign.name}.`
            : "Bu sayfa bir indirim kampanyasına bağlı değil."}{" "}
          Bağlantıyı yalnızca sahip değiştirebilir.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground">
            Bağlı sayfa, kampanyanın tarihlerini ve indirimli ürünleri gösterir. Kampanyanın kendisi
            değişmez.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label htmlFor={selectId} className="block font-medium">
                Kampanya
              </label>
              <Select
                id={selectId}
                className="w-64"
                value={chosen}
                disabled={saving}
                onChange={(e) => setChosen(e.target.value)}
              >
                <option value="">Bağlı değil</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              size="sm"
              disabled={saving || chosen === current}
              onClick={() => void apply(chosen ? Number(chosen) : null)}
            >
              {chosen ? "Bağla" : "Bağlantıyı kaldır"}
            </Button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
