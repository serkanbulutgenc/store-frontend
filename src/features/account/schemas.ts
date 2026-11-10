import { z } from "zod";
import type { components } from "../../../api/specs/openapi-store";

export const MIN_PASSWORD = 8;

const required = (message = "Bu alan zorunludur.") => z.string().trim().min(1, message);
const email = z.string().trim().email("Geçerli bir e-posta adresi girin.");
const password = z.string().min(MIN_PASSWORD, `Parola en az ${MIN_PASSWORD} karakter olmalıdır.`);

const matching = <T extends { password?: string; confirm: string }>(v: T, ctx: z.RefinementCtx) => {
  if (v.password !== v.confirm)
    ctx.addIssue({ code: "custom", path: ["confirm"], message: "Parolalar aynı değil." });
};

export const signUpSchema = z
  .object({ email, password, confirm: z.string() })
  .superRefine(matching);

/** Order confirmation offer: the email is the Order's, only a password is asked for. */
export const offerSchema = z.object({ password, confirm: z.string() }).superRefine(matching);

export const loginSchema = z.object({ email, password: z.string().min(1, "Parolayı girin.") });
export const resetRequestSchema = z.object({ email });
export const resetSchema = z.object({ password, confirm: z.string() }).superRefine(matching);

export const passwordChangeSchema = z
  .object({ current: z.string().min(1, "Mevcut parolanızı girin."), password, confirm: z.string() })
  .superRefine(matching);

export const emailChangeSchema = z.object({ email });

export const profileSchema = z.object({
  name: z.string().trim().max(255, "En fazla 255 karakter."),
  phone: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^[+\d][\d\s()-]{9,}$/.test(v),
      "Geçerli bir telefon numarası girin.",
    ),
  marketing_consent: z.boolean(),
});

export const addressSchema = z.object({
  full_name: required("Ad ve soyadınızı girin.").refine(
    (v) => v.split(/\s+/).length >= 2,
    "Ad ve soyadınızı girin.",
  ),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s()-]{9,}$/, "Geçerli bir telefon numarası girin."),
  il: required(),
  ilce: required(),
  mahalle: required(),
  street: required(),
  postal_code: z.string().trim().max(10, "En fazla 10 karakter."),
  is_default: z.boolean(),
});

export type AddressValues = z.infer<typeof addressSchema>;
export type SavedAddress = components["schemas"]["SavedAddressOut"];

export const emptyAddress: AddressValues = {
  full_name: "",
  phone: "",
  il: "",
  ilce: "",
  mahalle: "",
  street: "",
  postal_code: "",
  is_default: false,
};

export const MAX_ADDRESSES = 5;
