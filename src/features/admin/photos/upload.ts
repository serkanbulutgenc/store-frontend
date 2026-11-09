import { ApiError } from "@/lib/api/errors";
import type { ProductImageOut } from "../catalog/queries";

/** Multipart upload with progress; fetch cannot report upload progress, XHR can. */
export function uploadPhoto(
  productId: number,
  file: File,
  opts: { colourId?: number | null; onProgress: (fraction: number) => void },
): Promise<ProductImageOut> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    if (opts.colourId != null) form.append("colour_id", String(opts.colourId));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/admin/products/${productId}/images`);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response as ProductImageOut);
      else reject(ApiError.from(xhr.status, xhr.response));
    };
    xhr.onerror = () => reject(new ApiError(0, "network", "Bağlantı kurulamadı. Tekrar deneyin."));
    xhr.send(form);
  });
}
