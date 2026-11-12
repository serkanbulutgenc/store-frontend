const STATUS: Record<string, string> = {
  requested: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  received: "Teslim alındı",
  refunded: "İade ödendi",
};
export const RETURN_STATUSES = Object.keys(STATUS);
export const returnStatusLabel = (s: string) => STATUS[s] ?? s;

export function returnStatusTone(s: string): "neutral" | "good" | "warn" {
  if (s === "requested") return "warn";
  if (s === "refunded") return "good";
  return "neutral";
}

const REASON: Record<string, string> = {
  wrong_size: "Beden uymadı",
  changed_mind: "Vazgeçti",
  defective: "Ürün kusurlu",
  wrong_item: "Yanlış ürün gönderildi",
  other: "Diğer",
};
export const returnReasonLabel = (r: string) => REASON[r] ?? r;

export type ReturnStep = "approve" | "reject" | "receive" | "refund";

/** The steps Staff can take on a request in this status (permissions are checked apart). */
export function returnSteps(status: string): ReturnStep[] {
  switch (status) {
    case "requested":
      return ["approve", "reject"];
    case "approved":
      return ["receive"];
    case "received":
      return ["refund"];
    default:
      return [];
  }
}

export const STEP_LABEL: Record<ReturnStep, string> = {
  approve: "Onayla",
  reject: "Reddet",
  receive: "Teslim alındı",
  refund: "İade öde",
};

export const RESTOCK_OPTIONS = [
  { value: "yes", label: "Stoğa geri ekle" },
  { value: "no", label: "Stoğa ekleme (hasarlı / kullanılmış)" },
];

/** The receive form's `line_<id>` answers as the API body. */
export function receiveBody(values: Record<string, string>) {
  return {
    lines: Object.entries(values)
      .filter(([key]) => key.startsWith("line_"))
      .map(([key, value]) => ({ line_id: Number(key.slice(5)), restock: value === "yes" })),
  };
}
