/** Audit action names (backend `Action`) with their Turkish labels. */
export const AUDIT_ACTIONS: Record<string, string> = {
  login: "Giriş",
  mark_paid: "Ödendi işaretlendi",
  cancel: "Sipariş iptali",
  refund: "İade",
  ship: "Kargolandı",
  deliver: "Teslim edildi",
  return_request: "İade talebi",
  return_approved: "İade talebi onaylandı",
  return_rejected: "İade talebi reddedildi",
  return_received: "İade teslim alındı",
  order_edit: "Sipariş düzenleme",
  message_resend: "Mesaj yeniden gönderildi",
  stock_adjustment: "Stok düzeltme",
  price_change: "Fiyat değişikliği",
  settings_change: "Ayar değişikliği",
  staff_invited: "Personel davet edildi",
  staff_deactivated: "Personel devre dışı",
  role_change: "Rol değişikliği",
  photo_upload: "Fotoğraf yükleme",
  photo_delete: "Fotoğraf silme",
  photo_edit: "Fotoğraf düzenleme",
  invoice_edit: "Fatura düzenleme",
  export_run: "Dışa aktarım",
  catalogue_import: "Katalog içe aktarma",
  account_deletion: "Hesap silme",
};

export const auditActionLabel = (action: string) => AUDIT_ACTIONS[action] ?? action;

/** Pretty JSON for the before/after panels; null means the entry recorded nothing. */
export const formatSnapshot = (value: unknown): string | null =>
  value === null || value === undefined ? null : JSON.stringify(value, null, 2);
