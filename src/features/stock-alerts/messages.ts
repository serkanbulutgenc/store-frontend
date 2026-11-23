import { ApiError } from "@/lib/api/errors";

/** What the Shopper reads when subscribing fails; `fields.email` is shown beside the field. */
export function subscribeProblem(error: unknown): { message: string; email?: string } {
  if (!(error instanceof ApiError))
    return { message: "Şu anda kaydedilemedi. Lütfen tekrar deneyin." };
  const email = error.fields.email?.[0];
  if (email) return { message: email, email };
  if (error.code === "in_stock")
    return { message: "Bu beden yeniden stokta. Sepete ekleyebilirsiniz." };
  if (error.code === "stock_alert_limit")
    return {
      message:
        "Bu e-posta adresi için en fazla 5 ürün bekletilebilir. Önce bekleyen bir bildirimden vazgeçin.",
    };
  if (error.code === "stock_alerts_unavailable")
    return { message: "Stok bildirimi şu anda kullanılamıyor." };
  if (error.status === 429)
    return { message: "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin." };
  return { message: error.message };
}

/** Why a confirm or reject link failed. */
export function linkProblem(action: "confirm" | "reject", error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404)
      return 'Bu bağlantı geçersiz veya süresi dolmuş. Ürün sayfasından yeniden "Haber ver" diyebilirsiniz.';
    if (error.code === "in_stock" && action === "confirm")
      return "Bu ürün bu arada yeniden stoğa girdi. Ürün sayfasından sepete ekleyebilirsiniz.";
    if (error.status === 429)
      return "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.";
  }
  return "İşlem şu anda tamamlanamadı. Lütfen sayfayı yenileyip tekrar deneyin.";
}
