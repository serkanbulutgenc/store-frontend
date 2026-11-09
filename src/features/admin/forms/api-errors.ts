import { ApiError } from "@/lib/api/errors";

export type FormErrors = { form: string; fields: Record<string, string> };

/**
 * Form convention: `onSubmitAsync` catches the mutation error and returns this. TanStack
 * Form accepts `{ form, fields }` from a validator and shows the first message per field.
 */
export function apiErrorToFormErrors(error: unknown): FormErrors {
  if (!(error instanceof ApiError)) return { form: "Beklenmeyen bir hata oluştu.", fields: {} };
  const fields: Record<string, string> = {};
  for (const [name, messages] of Object.entries(error.fields)) {
    const first = messages[0];
    if (first) fields[name] = first;
  }
  return { form: error.message, fields };
}
