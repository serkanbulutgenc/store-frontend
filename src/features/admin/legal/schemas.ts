import { z } from "zod";

export const TITLE_MAX = 200;
export const BODY_MAX = 200_000;

export const legalFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Başlık boş olamaz.")
    .max(TITLE_MAX, `En fazla ${TITLE_MAX} karakter.`),
  body: z
    .string()
    .trim()
    .min(1, "Metin boş olamaz.")
    .max(BODY_MAX, `En fazla ${BODY_MAX} karakter.`),
});

export type LegalFormValues = z.infer<typeof legalFormSchema>;

/** True when the form holds exactly the saved text (the API refuses an unchanged save). */
export function isUnchanged(values: LegalFormValues, saved: { title: string; body: string }) {
  return values.title.trim() === saved.title.trim() && values.body.trim() === saved.body.trim();
}
