import { z } from "zod";

export const rejectFormSchema = z.object({
  reason: z.string().trim().min(3, "Müşterinin okuyacağı bir neden yazın.").max(500),
});

export const receiveFormSchema = z.record(z.string(), z.enum(["yes", "no"]));
