import { ApiError } from "@/lib/api/errors";
import type { CategoryOut } from "./queries";

/** Uploads (or replaces) a Category's image; processing continues on the server. */
export async function uploadCategoryImage(categoryId: number, file: File): Promise<CategoryOut> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`/api/admin/categories/${categoryId}/image`, {
    method: "POST",
    body: form,
  }).catch(() => {
    throw new ApiError(0, "network", "Bağlantı kurulamadı. Tekrar deneyin.");
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw ApiError.from(response.status, body);
  return body as CategoryOut;
}
