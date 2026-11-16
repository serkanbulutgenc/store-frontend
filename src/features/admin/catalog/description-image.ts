import { ApiError } from "@/lib/api/errors";

/** Uploads one image for use inside a Description; resolves to its public URL. */
export async function uploadDescriptionImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/admin/description-images", {
    method: "POST",
    body: form,
  }).catch(() => {
    throw new ApiError(0, "network", "Bağlantı kurulamadı. Tekrar deneyin.");
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw ApiError.from(response.status, body);
  return (body as { url: string }).url;
}
