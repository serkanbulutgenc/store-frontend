/** Client-side mirror of the upload rules; the API stays the authority. */
export const MAX_PHOTOS = 12;
export const MAX_BYTES = 15 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export function validateFile(file: Pick<File, "type" | "size" | "name">): string | null {
  const heicByName = !file.type && /\.(heic|heif)$/i.test(file.name);
  if (!TYPES.has(file.type) && !heicByName) return "Yalnızca JPEG, PNG veya WebP yüklenebilir.";
  if (file.size > MAX_BYTES) return "Dosya 15 MB'tan büyük olamaz.";
  return null;
}

export type Rejected = { file: File; reason: string };

/** Splits a drop or pick into files to upload and files to report, honouring the 12-photo cap. */
export function pickUploadable(files: File[], room: number) {
  const accepted: File[] = [];
  const rejected: Rejected[] = [];
  for (const file of files) {
    const reason = validateFile(file);
    if (reason) rejected.push({ file, reason });
    else if (accepted.length >= room)
      rejected.push({ file, reason: `Bir üründe en fazla ${MAX_PHOTOS} fotoğraf olabilir.` });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from === to || from < 0 || to < 0 || from >= next.length || to >= next.length) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}
