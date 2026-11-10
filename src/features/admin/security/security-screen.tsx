import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Me } from "@/lib/api/me";
import { apiErrorToFormErrors } from "../forms/api-errors";
import { bind, Field, FormMessage } from "../forms/field";
import { activateWithReauth, fetchTotpStatus, otpauthUrl } from "./totp";

export function SecurityScreen({ me }: { me: Me }) {
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ["admin", "totp"],
    queryFn: fetchTotpStatus,
    retry: false,
    // A refetch must not swap the secret the user is typing into their authenticator app.
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });
  const form = useForm({
    defaultValues: { code: "", password: "" },
    validators: {
      onSubmitAsync: async ({ value }) => {
        if (!/^\d{6}$/.test(value.code.trim()))
          return { form: "", fields: { code: "6 haneli kodu girin." } };
        try {
          await activateWithReauth(value.code.trim(), value.password);
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        return undefined;
      },
    },
    onSubmit: async () => {
      toast.success("İki adımlı doğrulama etkinleştirildi.");
      await qc.invalidateQueries({ queryKey: ["admin"] });
      // Permissions of an Owner who was not enrolled are empty until the next sign-in.
      window.location.assign("/admin");
    },
  });

  const s = status.data;
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-lg font-semibold">Güvenlik</h1>
      {me.mfa_required && !me.mfa_enrolled && (
        <p
          role="alert"
          className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900"
        >
          Hesabınız için iki adımlı doğrulama zorunludur. Etkinleştirene kadar yönetim ekranları
          kapalıdır.
        </p>
      )}
      {status.isPending && <p className="text-muted-foreground">Yükleniyor…</p>}
      {status.isError && (
        <p role="alert" className="text-red-700">
          {status.error instanceof Error ? status.error.message : "Durum alınamadı."}
        </p>
      )}
      <p className="text-muted-foreground">
        Etkinleştirmek için kodla birlikte parolanızı da girin. Çıkış yapmayın: yeni oturumda yeni
        bir anahtar oluşur ve uygulamanızdaki anahtar geçersiz olur.
      </p>
      {s?.active && <p>İki adımlı doğrulama etkin.</p>}
      {s && !s.active && (
        <>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Doğrulama uygulamanızda yeni bir hesap ekleyin ve aşağıdaki anahtarı girin.</li>
            <li>Uygulamanın gösterdiği 6 haneli kodu yazın.</li>
          </ol>
          <div className="space-y-1">
            <span className="block font-medium">Anahtar</span>
            <code className="block break-all rounded-md bg-muted p-2 font-mono text-sm">
              {s.secret}
            </code>
            <a className="text-muted-foreground underline" href={otpauthUrl(s.secret, me.email)}>
              Uygulamada aç
            </a>
          </div>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
          >
            <form.Field name="code">
              {(f) => (
                <Field field={f} label="Doğrulama kodu">
                  <Input inputMode="numeric" autoComplete="one-time-code" {...bind(f)} />
                </Field>
              )}
            </form.Field>
            <form.Field name="password">
              {(f) => (
                <Field field={f} label="Parola">
                  <Input type="password" autoComplete="current-password" {...bind(f)} />
                </Field>
              )}
            </form.Field>
            <form.Subscribe selector={(st) => st.errorMap.onSubmit}>
              {(err) => <FormMessage error={err} />}
            </form.Subscribe>
            <form.Subscribe selector={(st) => st.isSubmitting}>
              {(busy) => (
                <Button type="submit" disabled={busy}>
                  Etkinleştir
                </Button>
              )}
            </form.Subscribe>
          </form>
        </>
      )}
    </div>
  );
}
