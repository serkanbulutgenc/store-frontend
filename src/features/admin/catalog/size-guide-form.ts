import { z } from "zod";
import { DESCRIPTION_MAX, descriptionLength } from "./schemas";

/** The class Size guide: Markdown through the Description editor, with the Description's limit. */
export const classGuideSchema = z.object({
  text: z
    .string()
    .refine(
      (v) => descriptionLength(v) <= DESCRIPTION_MAX,
      `Beden tablosu en fazla ${DESCRIPTION_MAX} karakter olabilir.`,
    ),
});
export type ClassGuideValues = z.infer<typeof classGuideSchema>;

/** Sent as written; an empty text removes the class guide. */
export const toClassGuideBody = (v: ClassGuideValues) => ({ text: v.text });

/** Which guide a Product shows: its own override, or else its class's. */
export const guideSource = (override: string): "override" | "class" =>
  override.trim() === "" ? "class" : "override";
