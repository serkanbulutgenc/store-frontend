import { ApiError } from "@/lib/api/errors";

/** Client-side mirror of the Brand logo rules; the API stays the authority. */
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_ACCEPT = "image/png,image/jpeg,image/webp";
const TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function validateLogo(file: Pick<File, "type" | "size">): string | null {
  if (!TYPES.has(file.type)) return "Yalnızca PNG, JPEG veya WebP yüklenebilir.";
  if (file.size > LOGO_MAX_BYTES) return "Dosya en fazla 2 MB olabilir.";
  return null;
}

/** Uploads (or replaces) a Brand's logo; processing continues on the server. */
export async function uploadBrandLogo(brandId: number, file: File): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`/api/admin/brands/${brandId}/logo`, {
    method: "POST",
    body: form,
  }).catch(() => {
    throw new ApiError(0, "network", "Bağlantı kurulamadı. Tekrar deneyin.");
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw ApiError.from(response.status, body);
}
