import { ApiError } from "@/lib/api/errors";

// Limits mirror the API (NAME_MAX, MESSAGE_MAX, ORDER_NUMBER_MAX in contact_threads.py).
export const NAME_MAX = 100;
export const MESSAGE_MAX = 5000;
export const ORDER_NUMBER_MAX = 50;

export type ContactValues = {
  categoryId: number | null;
  name: string;
  email: string;
  orderNumber: string;
  message: string;
};

export type ContactErrors = Partial<
  Record<"category" | "name" | "email" | "order_number" | "message", string>
>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What is wrong with the form before it is sent. The API checks the same again. */
export function contactErrors(v: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  if (v.categoryId === null) errors.category = "Bir konu seçin.";
  const name = v.name.trim();
  if (!name) errors.name = "Adınızı yazın.";
  else if (name.length > NAME_MAX) errors.name = `Ad en fazla ${NAME_MAX} karakter olabilir.`;
  if (!EMAIL.test(v.email.trim())) errors.email = "Geçerli bir e-posta adresi yazın.";
  if (v.orderNumber.trim().length > ORDER_NUMBER_MAX)
    errors.order_number = "Sipariş numarası çok uzun.";
  const message = v.message.trim();
  if (!message) errors.message = "Mesajınızı yazın.";
  else if (message.length > MESSAGE_MAX)
    errors.message = `Mesaj en fazla ${MESSAGE_MAX} karakter olabilir.`;
  return errors;
}

export type SubmitProblem = { fields: ContactErrors; general: string | null };

const FIELDS = ["category", "name", "email", "order_number", "message"] as const;

/**
 * What to tell the Shopper when sending failed: the API's field messages (422) next to their
 * fields, a plain "wait a little" for the rate limit (429), and one line for anything else.
 */
export function submitProblem(error: unknown): SubmitProblem {
  if (error instanceof ApiError) {
    if (error.status === 429)
      return {
        fields: {},
        general:
          "Kısa sürede çok fazla mesaj gönderdiniz. Lütfen birkaç dakika sonra tekrar deneyin.",
      };
    if (error.status === 422) {
      const fields: ContactErrors = {};
      for (const f of FIELDS) {
        // The API names the category field `category_id`.
        const messages =
          error.fields[f] ?? (f === "category" ? error.fields.category_id : undefined);
        if (messages?.[0]) fields[f] = messages[0];
      }
      return { fields, general: Object.keys(fields).length ? null : error.message };
    }
  }
  return {
    fields: {},
    general: "Mesajınız gönderilemedi. Lütfen biraz sonra tekrar deneyin.",
  };
}

export const SUCCESS_TITLE = "Mesajınız bize ulaştı";
export const SUCCESS_TEXT =
  "Size e-posta ile bir onay gönderdik. Yanıtımızı da e-posta ile ileteceğiz; sitede ayrıca bir yazışma ekranı yoktur.";
