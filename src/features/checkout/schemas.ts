import { z } from "zod";
import type { components } from "../../../api/specs/openapi-store";
import type { PaymentChoice } from "./fees";

const required = (message = "Bu alan zorunludur.") => z.string().trim().min(1, message);

const addressSchema = z.object({
  il: required(),
  ilce: required(),
  mahalle: required(),
  street: required(),
  postal_code: z.string().trim().max(10, "En fazla 10 karakter."),
});

export const checkoutSchema = z
  .object({
    full_name: required("Ad ve soyadınızı girin.").refine(
      (v) => v.split(/\s+/).length >= 2,
      "Ad ve soyadınızı girin.",
    ),
    email: z.string().trim().email("Geçerli bir e-posta adresi girin."),
    phone: z
      .string()
      .trim()
      .regex(/^[+\d][\d\s()-]{9,}$/, "Geçerli bir telefon numarası girin."),
    shipping_address: addressSchema,
    billing_different: z.boolean(),
    billing_address: z.object({
      il: z.string(),
      ilce: z.string(),
      mahalle: z.string(),
      street: z.string(),
      postal_code: z.string(),
    }),
    payment_method: z.enum(["bank_transfer", "cod"]),
    contract_acknowledged: z.boolean(),
    cod_fee_consent: z.boolean(),
    marketing_consent: z.boolean(),
    website: z.string(),
  })
  .superRefine((v, ctx) => {
    if (!v.contract_acknowledged)
      ctx.addIssue({
        code: "custom",
        path: ["contract_acknowledged"],
        message: "Devam etmek için mesafeli satış sözleşmesini onaylamalısınız.",
      });
    if (v.payment_method === "cod" && !v.cod_fee_consent)
      ctx.addIssue({
        code: "custom",
        path: ["cod_fee_consent"],
        message: "Kapıda ödeme bedelini kabul etmelisiniz.",
      });
    if (v.billing_different) {
      const parsed = addressSchema.safeParse(v.billing_address);
      if (!parsed.success)
        for (const issue of parsed.error.issues)
          ctx.addIssue({
            code: "custom",
            path: ["billing_address", ...issue.path],
            message: issue.message,
          });
    }
  });

export type CheckoutValues = z.infer<typeof checkoutSchema>;

const blankAddress = { il: "", ilce: "", mahalle: "", street: "", postal_code: "" };

export const emptyCheckout: CheckoutValues = {
  full_name: "",
  email: "",
  phone: "",
  shipping_address: blankAddress,
  billing_different: false,
  billing_address: blankAddress,
  payment_method: "bank_transfer" as PaymentChoice,
  contract_acknowledged: false,
  cod_fee_consent: false,
  marketing_consent: false,
  website: "",
};

/** API body: billing omitted unless another address is ticked; COD consent only for COD. */
export function toCheckoutBody(
  v: CheckoutValues,
  legalVersions: Record<string, string>,
): components["schemas"]["CheckoutIn"] {
  return {
    full_name: v.full_name,
    email: v.email,
    phone: v.phone,
    shipping_address: v.shipping_address,
    billing_address: v.billing_different ? v.billing_address : null,
    payment_method: v.payment_method,
    contract_acknowledged: v.contract_acknowledged,
    cod_fee_consent: v.payment_method === "cod" && v.cod_fee_consent,
    marketing_consent: v.marketing_consent,
    legal_versions: legalVersions,
    website: v.website,
  };
}
