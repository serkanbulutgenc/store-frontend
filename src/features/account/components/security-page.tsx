import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiErrorToFormErrors } from "@/features/admin/forms/api-errors";
import { bind, Field, FormMessage } from "@/features/admin/forms/field";
import { changePassword, requestEmailChange } from "../auth";
import { accountQuery, useRequestDeletion } from "../queries";
import { emailChangeSchema, passwordChangeSchema } from "../schemas";
import { Notice } from "./auth-card";

function EmailChange({ current }: { current: string }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm({
    defaultValues: { email: "" },
    validators: {
      onSubmit: emailChangeSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await requestEmailChange(value.email.trim());
          setSentTo(value.email.trim());
          return undefined;
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
      },
    },
  });
  return (
    <section aria-labelledby="email" className="space-y-3">
      <h2 id="email" className="text-lg font-semibold">
        E-posta adresi
      </h2>
      <p>
        Şu anki adresiniz: <strong>{current}</strong>
      </p>
      {sentTo ? (
        <Notice title="Yeni adresinizi doğrulayın">
          {sentTo} adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıklayana kadar adresiniz
          değişmez.
        </Notice>
      ) : (
        <form
          noValidate
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field name="email">
            {(f) => (
              <Field field={f} label="Yeni e-posta adresi">
                <Input type="email" autoComplete="email" className="h-11" {...bind(f)} />
              </Field>
            )}
          </form.Field>
          <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
            {(err) => <FormMessage error={err} />}
          </form.Subscribe>
          <Button type="submit">Doğrulama gönder</Button>
        </form>
      )}
    </section>
  );
}

function PasswordChange() {
  const form = useForm({
    defaultValues: { current: "", password: "", confirm: "" },
    onSubmit: ({ formApi }) => {
      toast.success("Parolanız değiştirildi.");
      formApi.reset();
    },
    validators: {
      onSubmit: passwordChangeSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await changePassword(value.current, value.password);
          return undefined;
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
      },
    },
  });
  return (
    <section aria-labelledby="password" className="space-y-3">
      <h2 id="password" className="text-lg font-semibold">
        Parola
      </h2>
      <form
        noValidate
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field name="current">
          {(f) => (
            <Field field={f} label="Mevcut parola">
              <Input
                type="password"
                autoComplete="current-password"
                className="h-11"
                {...bind(f)}
              />
            </Field>
          )}
        </form.Field>
        <form.Field name="password">
          {(f) => (
            <Field field={f} label="Yeni parola" hint="En az 8 karakter.">
              <Input type="password" autoComplete="new-password" className="h-11" {...bind(f)} />
            </Field>
          )}
        </form.Field>
        <form.Field name="confirm">
          {(f) => (
            <Field field={f} label="Yeni parola (tekrar)">
              <Input type="password" autoComplete="new-password" className="h-11" {...bind(f)} />
            </Field>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
          {(err) => <FormMessage error={err} />}
        </form.Subscribe>
        <Button type="submit">Parolayı değiştir</Button>
      </form>
    </section>
  );
}

function DeleteAccount({ requested }: { requested: boolean }) {
  const request = useRequestDeletion();
  const [confirming, setConfirming] = useState(false);
  return (
    <section aria-labelledby="delete" className="space-y-3">
      <h2 id="delete" className="text-lg font-semibold">
        Hesabı sil
      </h2>
      {requested ? (
        <Notice title="Silme talebiniz alındı">
          Talebiniz mağaza yöneticisine iletildi. Onaylandığında kişisel bilgileriniz silinir;
          siparişleriniz yasal saklama süresi boyunca ad ve fatura adresinizle birlikte tutulur.
        </Notice>
      ) : (
        <>
          <p className="text-muted-foreground">
            Silme talebiniz mağaza yöneticisine iletilir. Onaylandığında kişisel bilgileriniz
            silinir; siparişleriniz yasal saklama süresi boyunca ad ve fatura adresinizle birlikte
            tutulur.
          </p>
          {confirming ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={request.isPending}
                onClick={() =>
                  request.mutate(undefined, {
                    onError: () => toast.error("Talep gönderilemedi. Lütfen tekrar deneyin."),
                  })
                }
              >
                Evet, hesabımı silmek istiyorum
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Vazgeç
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setConfirming(true)}>
              Hesabımı sil
            </Button>
          )}
        </>
      )}
    </section>
  );
}

export function SecurityPage() {
  const { data: account } = useQuery(accountQuery);
  if (!account) return null;
  return (
    <div className="max-w-md space-y-8">
      <h1 className="text-2xl font-semibold">Güvenlik</h1>
      <EmailChange current={account.email} />
      <PasswordChange />
      <DeleteAccount requested={account.deletion_requested} />
    </div>
  );
}
