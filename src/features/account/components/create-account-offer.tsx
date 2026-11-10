import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiErrorToFormErrors } from "@/features/admin/forms/api-errors";
import { bind, Field, FormMessage } from "@/features/admin/forms/field";
import { signUp } from "../auth";
import { accountQuery } from "../queries";
import { offerSchema } from "../schemas";
import { CheckEmailNotice } from "./auth-forms";

/** On the confirmation page: sign up with the Order's email, asking for a password only. */
export function CreateAccountOffer({ email }: { email: string }) {
  const { data: account } = useQuery(accountQuery);
  const [sent, setSent] = useState(false);
  const form = useForm({
    defaultValues: { password: "", confirm: "" },
    validators: {
      onSubmit: offerSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await signUp(email, value.password);
          setSent(true);
          return undefined;
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
      },
    },
  });
  // Signed in: the Order was placed on the account already.
  if (account) return null;
  return (
    <section aria-labelledby="offer" className="space-y-3 rounded-md bg-muted p-4">
      <h2 id="offer" className="font-semibold">
        Hesap oluşturun
      </h2>
      {sent ? (
        <CheckEmailNotice email={email} />
      ) : (
        <>
          <p>
            Siparişlerinizi takip etmek ve sonraki alışverişlerde zaman kazanmak için {email}{" "}
            adresiyle bir parola belirleyerek hesap oluşturabilirsiniz. Bu siparişiniz, e-postanızı
            doğruladığınızda hesabınıza eklenir.
          </p>
          <form
            noValidate
            className="max-w-sm space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
          >
            <form.Field name="password">
              {(f) => (
                <Field field={f} label="Parola" hint="En az 8 karakter.">
                  <Input
                    type="password"
                    autoComplete="new-password"
                    className="h-11"
                    {...bind(f)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="confirm">
              {(f) => (
                <Field field={f} label="Parola (tekrar)">
                  <Input
                    type="password"
                    autoComplete="new-password"
                    className="h-11"
                    {...bind(f)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
              {(err) => <FormMessage error={err} />}
            </form.Subscribe>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(submitting) => (
                <Button type="submit" disabled={submitting}>
                  Hesap oluştur
                </Button>
              )}
            </form.Subscribe>
          </form>
        </>
      )}
    </section>
  );
}
