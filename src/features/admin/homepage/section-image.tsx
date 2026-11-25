import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import {
  ALT_MAX,
  IMAGE_TYPES,
  type LayoutImage,
  LINK_MAX,
  layoutImagesQuery,
  useLayoutImageActions,
} from "./queries";

const message = (e: unknown) =>
  e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.";

/** Why a file or text cannot be sent yet, or null. The server checks again. */
export function imageProblem(altText: string, file?: File): string | null {
  if (!altText.trim()) return "Önce görselin açıklamasını yazın.";
  if (altText.length > ALT_MAX) return `Açıklama en fazla ${ALT_MAX} karakter olabilir.`;
  if (file && !IMAGE_TYPES.includes(file.type)) return "Görsel JPEG, PNG, WebP veya GIF olmalı.";
  return null;
}

/** A new image: its description first (it is required), then the file. Calls `onCreated` with the
 * new image's id; the caller puts it in the section. */
export function NewSectionImage({
  idPrefix,
  label,
  onCreated,
}: {
  idPrefix: string;
  label: string;
  onCreated: (id: number) => void;
}) {
  const { upload } = useLayoutImageActions();
  const [alt, setAlt] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    const problem = imageProblem(alt, file);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      const made = await upload({ file, altText: alt.trim(), link: link.trim() });
      setAlt("");
      setLink("");
      onCreated(made.id);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-dashed border-border p-3">
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-new-alt`} className="block font-medium">
          {label}: görsel açıklaması
        </label>
        <Input
          id={`${idPrefix}-new-alt`}
          value={alt}
          maxLength={ALT_MAX}
          onChange={(e) => setAlt(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-new-link`} className="block font-medium">
          Bağlantı (isteğe bağlı)
        </label>
        <Input
          id={`${idPrefix}-new-link`}
          value={link}
          maxLength={LINK_MAX}
          placeholder="/ara?sort=newest"
          onChange={(e) => setLink(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-new-file`} className="block font-medium">
          {label}: görsel yükle
        </label>
        <input
          id={`${idPrefix}-new-file`}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          disabled={busy}
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <p className="text-muted-foreground">
          JPEG, PNG, WebP veya GIF. Geniş bir görsel seçin; telefon için ayrıca bir görsel
          ekleyebilirsiniz.
        </p>
      </div>
      {busy && (
        <p role="status" className="text-muted-foreground">
          Yükleniyor…
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** One uploaded image of a section: the picture, its description and link, a replacement file and
 * the phone picture. */
export function SectionImage({
  image,
  idPrefix,
  label,
}: {
  image: LayoutImage;
  idPrefix: string;
  label: string;
}) {
  const { upload, edit, removeMobile } = useLayoutImageActions();
  const [alt, setAlt] = useState(image.alt_text);
  const [link, setLink] = useState(image.link);
  const [error, setError] = useState<string | null>(null);
  const field = (suffix: string) => `${idPrefix}-${image.id}-${suffix}`;

  async function run(job: () => Promise<unknown>) {
    setError(null);
    try {
      await job();
    } catch (e) {
      setError(message(e));
    }
  }

  async function saveAlt() {
    if (alt === image.alt_text) return;
    const problem = imageProblem(alt);
    if (problem) {
      setAlt(image.alt_text);
      return setError(problem);
    }
    await run(() => edit({ imageId: image.id, alt_text: alt.trim() }));
  }

  async function replace(which: "image" | "mobile-image", file: File | undefined) {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return setError(imageProblem("x", file));
    await run(async () => {
      await upload({ imageId: image.id, which, file });
      toast.success(which === "image" ? "Görsel değiştirildi." : "Telefon görseli eklendi.");
    });
  }

  const picture = image.image;
  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div className="flex flex-wrap items-start gap-3">
        {picture && (
          <img
            src={picture.original_url}
            alt={image.alt_text}
            className="h-24 max-w-48 rounded-md border object-contain"
          />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <label htmlFor={field("alt")} className="block font-medium">
            {label}: görsel açıklaması
          </label>
          <Input
            id={field("alt")}
            value={alt}
            maxLength={ALT_MAX}
            onChange={(e) => setAlt(e.target.value)}
            onBlur={() => void saveAlt()}
          />
          <label htmlFor={field("link")} className="block font-medium">
            Bağlantı (isteğe bağlı)
          </label>
          <Input
            id={field("link")}
            value={link}
            maxLength={LINK_MAX}
            onChange={(e) => setLink(e.target.value)}
            onBlur={() => {
              if (link !== image.link)
                void run(() => edit({ imageId: image.id, link: link.trim() }));
            }}
          />
        </div>
      </div>
      {(picture?.status === "processing" || image.mobile_image?.status === "processing") && (
        <p role="status" className="text-muted-foreground">
          Görsel işleniyor…
        </p>
      )}
      {picture?.status === "failed" && (
        <p role="alert" className="text-red-700">
          Görsel işlenemedi; başka bir dosya yükleyin.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          <span className="mr-2 font-medium">Görseli değiştir</span>
          <input
            type="file"
            aria-label={`${label}: görseli değiştir`}
            accept={IMAGE_TYPES.join(",")}
            onChange={(e) => {
              void replace("image", e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <label className="text-sm">
          <span className="mr-2 font-medium">Telefon görseli</span>
          <input
            type="file"
            aria-label={`${label}: telefon görseli yükle`}
            accept={IMAGE_TYPES.join(",")}
            onChange={(e) => {
              void replace("mobile-image", e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {image.mobile_image && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => void run(() => removeMobile(image.id))}
          >
            Telefon görselini kaldır
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** The section images among `ids`, by id. An id that is missing from the map is not a section image
 * (for example a Banner picked on the Afişler screen) or no longer exists. */
export function useSectionImages(ids: number[]) {
  const query = useQuery(layoutImagesQuery(ids));
  const byId = new Map((query.data ?? []).map((i) => [i.id, i]));
  return { byId, loading: query.isLoading && ids.length > 0 };
}
