import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Star, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  coloursQuery,
  imagesQuery,
  keys,
  type ProductImageOut,
  useDeleteImage,
  useReorderImages,
  useUpdateImage,
} from "../catalog/queries";
import { MAX_PHOTOS, moveItem, pickUploadable } from "./rules";
import { uploadPhoto } from "./upload";

type Pending = { key: number; file: File; preview: string; progress: number; error?: string };
let nextKey = 0;

const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

/** Smallest derivative that is still sharp in a grid cell; falls back to the original. */
function thumbOf(img: ProductImageOut) {
  const sorted = [...img.derivatives].sort((a, b) => a.width - b.width);
  return (sorted.find((d) => d.width >= 400) ?? sorted[0])?.url ?? img.original_url;
}

export function PhotosScreen({ productId }: { productId: number }) {
  const { data: images } = useSuspenseQuery(imagesQuery(productId));
  const { data: colours = [] } = useQuery(coloursQuery);
  const qc = useQueryClient();
  const update = useUpdateImage(productId);
  const reorder = useReorderImages(productId);
  const remove = useDeleteImage(productId);

  const [pending, setPending] = useState<Pending[]>([]);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [dropping, setDropping] = useState(false);
  const [deleting, setDeleting] = useState<ProductImageOut | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const previews = useRef(new Set<string>());

  useEffect(() => {
    const urls = previews.current;
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, []);

  const room = MAX_PHOTOS - images.length - pending.filter((p) => !p.error).length;

  function patch(key: number, change: Partial<Pending>) {
    setPending((list) => list.map((p) => (p.key === key ? { ...p, ...change } : p)));
  }

  async function send(item: Pending) {
    patch(item.key, { progress: 0, error: undefined });
    try {
      await uploadPhoto(productId, item.file, {
        onProgress: (progress) => patch(item.key, { progress }),
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: keys.images(productId) }),
        qc.invalidateQueries({ queryKey: keys.products }),
      ]);
      setPending((list) => list.filter((p) => p.key !== item.key));
      URL.revokeObjectURL(item.preview);
      previews.current.delete(item.preview);
    } catch (e) {
      patch(item.key, { error: message(e, "Yükleme başarısız.") });
    }
  }

  function addFiles(list: FileList | File[] | null) {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    const { accepted, rejected } = pickUploadable(files, room);
    for (const r of rejected) toast.error(`${r.file.name}: ${r.reason}`);
    const items = accepted.map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      return { key: nextKey++, file, preview, progress: 0 } satisfies Pending;
    });
    setPending((l) => [...l, ...items]);
    for (const item of items) void send(item);
  }

  async function run(action: Promise<unknown>, fallback: string) {
    try {
      await action;
    } catch (e) {
      toast.error(message(e, fallback));
    }
  }

  function move(from: number, to: number) {
    const ids = moveItem(images, from, to).map((i) => i.id);
    if (ids.join() !== images.map((i) => i.id).join())
      void run(reorder.mutateAsync(ids), "Sıra kaydedilemedi.");
  }

  async function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    try {
      await remove.mutateAsync(target.id);
      toast.success("Fotoğraf silindi.");
    } catch (e) {
      // The API blocks deleting the last photo of a published product with a Turkish message.
      toast.error(message(e, "Fotoğraf silinemedi."));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-base font-semibold">Fotoğraflar</h2>
        <span className="text-muted-foreground">
          {images.length}/{MAX_PHOTOS}
        </span>
      </div>

      {/* biome-ignore lint/a11y/useSemanticElements: drop target wrapping real buttons */}
      <div
        role="group"
        aria-label="Fotoğraf yükleme alanı"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDropping(true);
          }
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setDropping(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-border p-6 text-center",
          dropping && "border-primary bg-accent",
        )}
      >
        <p className="text-muted-foreground">
          Fotoğrafları buraya sürükleyin ya da seçin. JPEG, PNG veya WebP · en fazla 15 MB · uzun
          kenar en az 800 px.
        </p>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button size="lg" disabled={room <= 0} onClick={() => galleryRef.current?.click()}>
            <ImagePlus size={18} aria-hidden /> Galeriden seç
          </Button>
          <Button
            size="lg"
            variant="outline"
            disabled={room <= 0}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera size={18} aria-hidden /> Fotoğraf çek
          </Button>
        </div>
        <input
          ref={galleryRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          tabIndex={-1}
          aria-label="Fotoğraf dosyaları"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-label="Kamera"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {images.length === 0 && pending.length === 0 && (
        <p className="text-muted-foreground">Henüz fotoğraf yok. Fotoğrafsız ürün yayınlanamaz.</p>
      )}

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {images.map((img, i) => (
          <li
            key={img.id}
            draggable
            onDragStart={() => setDragId(img.id)}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onDragOver={(e) => {
              if (dragId !== null) {
                e.preventDefault();
                setOverId(img.id);
              }
            }}
            onDrop={(e) => {
              if (dragId === null) return;
              e.preventDefault();
              const from = images.findIndex((x) => x.id === dragId);
              setDragId(null);
              setOverId(null);
              move(from, i);
            }}
            className={cn(
              "space-y-2 rounded-md border border-border bg-card p-2",
              overId === img.id && dragId !== img.id && "outline-2 outline-primary",
              dragId === img.id && "opacity-50",
            )}
          >
            <div className="relative aspect-square overflow-hidden rounded bg-accent">
              {img.status === "processing" ? (
                <div className="flex h-full items-center justify-center">
                  <Badge tone="warn">İşleniyor</Badge>
                </div>
              ) : img.status === "failed" ? (
                <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center">
                  <Badge tone="warn">İşlenemedi</Badge>
                  {img.error && <span className="text-muted-foreground">{img.error}</span>}
                </div>
              ) : (
                <img
                  src={thumbOf(img)}
                  alt={img.alt_text}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              )}
              {img.is_primary && (
                <span className="absolute left-1 top-1">
                  <Badge tone="good">Ana</Badge>
                </span>
              )}
            </div>
            <Select
              aria-label={`Renk etiketi, fotoğraf ${i + 1}`}
              value={img.colour?.id ?? ""}
              onChange={(e) =>
                void run(
                  update.mutateAsync({
                    id: img.id,
                    body: { colour_id: e.target.value === "" ? null : Number(e.target.value) },
                  }),
                  "Renk kaydedilemedi.",
                )
              }
            >
              <option value="">Renk yok (ortak)</option>
              {colours
                .filter((c) => c.is_active || c.id === img.colour?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                aria-label="Öne al"
                disabled={i === 0}
                onClick={() => move(i, i - 1)}
              >
                <ChevronLeft size={16} aria-hidden />
              </Button>
              <Button
                size="sm"
                variant="outline"
                aria-label="Geriye al"
                disabled={i === images.length - 1}
                onClick={() => move(i, i + 1)}
              >
                <ChevronRight size={16} aria-hidden />
              </Button>
              <Button
                size="sm"
                variant="outline"
                aria-label="Ana fotoğraf yap"
                disabled={img.is_primary || img.status !== "ready"}
                onClick={() =>
                  void run(
                    update.mutateAsync({ id: img.id, body: { is_primary: true } }),
                    "Ana fotoğraf değiştirilemedi.",
                  )
                }
              >
                <Star size={16} aria-hidden />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                aria-label="Sil"
                onClick={() => setDeleting(img)}
              >
                <Trash2 size={16} aria-hidden />
              </Button>
            </div>
          </li>
        ))}

        {pending.map((p) => (
          <li key={p.key} className="space-y-2 rounded-md border border-border bg-card p-2">
            <div className="relative aspect-square overflow-hidden rounded bg-accent">
              <img src={p.preview} alt="" className="h-full w-full object-cover opacity-70" />
            </div>
            {p.error ? (
              <div className="space-y-1">
                <p className="text-red-700">{p.error}</p>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => void send(p)}>
                    Tekrar dene
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPending((l) => l.filter((x) => x.key !== p.key))}
                  >
                    Kaldır
                  </Button>
                </div>
              </div>
            ) : (
              <progress
                className="w-full"
                max={1}
                value={p.progress}
                aria-label={`${p.file.name} yükleniyor`}
              />
            )}
          </li>
        ))}
      </ul>

      <Dialog open={deleting !== null} onClose={() => setDeleting(null)} title="Fotoğrafı sil">
        <p className="text-muted-foreground">Bu fotoğraf kalıcı olarak silinecek.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Vazgeç
          </Button>
          <Button onClick={() => void confirmDelete()}>Sil</Button>
        </div>
      </Dialog>
    </div>
  );
}
