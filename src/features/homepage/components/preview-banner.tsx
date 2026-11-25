/** Marks the Storefront as a preview of the Vitrin layout, so nobody mistakes it for the live page. */
export function PreviewBanner() {
  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-300 px-4 py-2 text-center text-sm font-medium text-amber-950"
    >
      <span>Önizleme: Vitrin düzenini görüyorsunuz. Mağaza ziyaretçileri bu sayfayı görmez.</span>
      <a href="/admin/homepage" className="underline underline-offset-2">
        Vitrin'e dön
      </a>
    </div>
  );
}
