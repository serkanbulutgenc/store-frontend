const STATUS: Record<string, string> = {
  new: "Sipariş alındı",
  preparing: "Hazırlanıyor",
  shipped: "Kargoya verildi",
  delivered: "Teslim edildi",
  completed: "Tamamlandı",
  cancelled: "İptal edildi",
  return_requested: "İade talep edildi",
  returned: "İade alındı",
};

const PAYMENT: Record<string, string> = {
  unpaid: "Ödeme bekleniyor",
  paid: "Ödendi",
  refunded: "İade edildi",
};

/** Turkish label for an Order status; an unknown value is shown as is, never hidden. */
export const statusLabel = (status: string) => STATUS[status] ?? status;
export const paymentLabel = (status: string) => PAYMENT[status] ?? status;
