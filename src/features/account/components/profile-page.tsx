import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiErrorToFormErrors } from "@/features/admin/forms/api-errors";
import { bind, Field, FormMessage } from "@/features/admin/forms/field";
import { type Account, accountQuery, useUpdateProfile } from "../queries";
import { profileSchema } from "../schemas";

function ProfileForm({ account }: { account: Account }) {
  const update = useUpdateProfile();
  const form = useForm({
    defaultValues: {
      name: account.name,
      phone: account.phone,
      marketing_consent: account.marketing_consent,
    },
    validators: {
      onSubmit: profileSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await update.mutateAsync(value);
          toast.success("Bilgileriniz kaydedildi.");
          return undefined;
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
      },
    },
  });
  return (
    <section aria-labelledby="profile" className="max-w-md space-y-4">
      <h1 id="profile" className="text-2xl font-semibold">
        Profil
      </h1>
      <form
        noValidate
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div className="space-y-1">
          <span className="block font-medium">E-posta</span>
          <p>{account.email}</p>
          <p className="text-muted-foreground">
            E-postanızı Güvenlik sayfasından değiştirebilirsiniz.
          </p>
        </div>
        <form.Field name="name">
          {(f) => (
            <Field field={f} label="Ad soyad">
              <Input autoComplete="name" className="h-11" {...bind(f)} />
            </Field>
          )}
        </form.Field>
        <form.Field name="phone">
          {(f) => (
            <Field field={f} label="Telefon">
              <Input type="tel" autoComplete="tel" className="h-11" {...bind(f)} />
            </Field>
          )}
        </form.Field>
        <form.Field name="marketing_consent">
          {(f) => (
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={f.state.value}
                onChange={(e) => f.handleChange(e.target.checked)}
                className="mt-1 size-4 accent-primary"
              />
              <span>
                Kampanya ve duyurulardan e-posta ile haberdar olmak istiyorum. İstediğiniz zaman
                vazgeçebilirsiniz.
              </span>
            </label>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
          {(err) => <FormMessage error={err} />}
        </form.Subscribe>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(submitting) => (
            <Button type="submit" disabled={submitting}>
              Kaydet
            </Button>
          )}
        </form.Subscribe>
      </form>
    </section>
  );
}

export function ProfilePage() {
  const { data: account } = useQuery(accountQuery);
  return account ? <ProfileForm account={account} /> : null;
}
