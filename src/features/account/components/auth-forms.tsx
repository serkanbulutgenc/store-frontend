import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiErrorToFormErrors } from "@/features/admin/forms/api-errors";
import { bind, Field, FormMessage } from "@/features/admin/forms/field";
import { fetchMe } from "@/lib/api/fetch-me";
import { type AuthOutcome, logIn, requestPasswordReset, resetPassword, signUp } from "../auth";
import { ACCOUNT_KEY } from "../queries";
import { loginSchema, resetRequestSchema, resetSchema, signUpSchema } from "../schemas";
import { Notice } from "./auth-card";

const handler = (form: { handleSubmit: () => Promise<void> }) => (e: React.FormEvent) => {
  e.preventDefault();
  void form.handleSubmit();
};

/** Verification mail sent: the same notice for sign-up and for a login that is not verified yet. */
export function CheckEmailNotice({ email }: { email: string }) {
  return (
    <Notice title="E-postanızı doğrulayın">
      {email} adresine bir doğrulama bağlantısı gönderdik. Hesabınıza giriş yapabilmek için
      bağlantıya tıklayın.
    </Notice>
  );
}

export function SignUpForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm({
    defaultValues: { email: defaultEmail, password: "", confirm: "" },
    validators: {
      onSubmit: signUpSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await signUp(value.email.trim(), value.password);
          setSentTo(value.email.trim());
          return undefined;
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
      },
    },
  });
  if (sentTo) return <CheckEmailNotice email={sentTo} />;
  return (
    <form noValidate className="space-y-3" onSubmit={handler(form)}>
      <form.Field name="email">
        {(f) => (
          <Field field={f} label="E-posta">
            <Input type="email" autoComplete="email" className="h-11" {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Field name="password">
        {(f) => (
          <Field field={f} label="Parola" hint="En az 8 karakter.">
            <Input type="password" autoComplete="new-password" className="h-11" {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Field name="confirm">
        {(f) => (
          <Field field={f} label="Parola (tekrar)">
            <Input type="password" autoComplete="new-password" className="h-11" {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => <FormMessage error={err} />}
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => (
          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            Hesap oluştur
          </Button>
        )}
      </form.Subscribe>
      <p className="text-muted-foreground">
        Zaten hesabınız var mı?{" "}
        <Link to="/hesap/giris" className="text-primary underline">
          Giriş yapın
        </Link>
      </p>
    </form>
  );
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [unverified, setUnverified] = useState<string | null>(null);
  const result = useRef<AuthOutcome>("signed_in");
  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: {
      onSubmit: loginSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          result.current = await logIn(value.email.trim(), value.password);
          return undefined;
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
      },
    },
    onSubmit: async ({ value }) => {
      if (result.current === "verify_email") return setUnverified(value.email.trim());
      try {
        qc.removeQueries({ queryKey: ACCOUNT_KEY }); // the cached signed-out answer is stale
        await router.invalidate();
        // A Dashboard user has no Storefront account: send them to the Dashboard.
        await router.navigate({ href: (await fetchMe()) ? "/admin" : redirectTo });
      } catch {
        toast.error("Giriş yapıldı ancak sayfa yüklenemedi. Lütfen sayfayı yenileyin.");
      }
    },
  });
  if (unverified) return <CheckEmailNotice email={unverified} />;
  return (
    <form noValidate className="space-y-3" onSubmit={handler(form)}>
      <form.Field name="email">
        {(f) => (
          <Field field={f} label="E-posta">
            <Input type="email" autoComplete="username" className="h-11" {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Field name="password">
        {(f) => (
          <Field field={f} label="Parola">
            <Input type="password" autoComplete="current-password" className="h-11" {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => <FormMessage error={err} />}
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => (
          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            Giriş yap
          </Button>
        )}
      </form.Subscribe>
      <p className="flex justify-between text-muted-foreground">
        <Link to="/hesap/sifre-sifirla" className="text-primary underline">
          Şifremi unuttum
        </Link>
        <Link to="/hesap/kayit" className="text-primary underline">
          Hesap oluştur
        </Link>
      </p>
    </form>
  );
}

export function ResetRequestForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm({
    defaultValues: { email: "" },
    validators: {
      onSubmit: resetRequestSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await requestPasswordReset(value.email.trim());
          setSentTo(value.email.trim());
          return undefined;
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
      },
    },
  });
  if (sentTo)
    return (
      <Notice title="Bağlantı gönderildi">
        {sentTo} adresine kayıtlı bir hesap varsa, parolanızı sıfırlamanız için bir bağlantı
        gönderdik.
      </Notice>
    );
  return (
    <form noValidate className="space-y-3" onSubmit={handler(form)}>
      <form.Field name="email">
        {(f) => (
          <Field field={f} label="E-posta">
            <Input type="email" autoComplete="email" className="h-11" {...bind(f)} />
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => <FormMessage error={err} />}
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => (
          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            Sıfırlama bağlantısı gönder
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export function ResetForm({ resetKey }: { resetKey: string }) {
  const [done, setDone] = useState(false);
  const form = useForm({
    defaultValues: { password: "", confirm: "" },
    validators: {
      onSubmit: resetSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await resetPassword(resetKey, value.password);
          setDone(true);
          return undefined;
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
      },
    },
  });
  if (done)
    return (
      <Notice title="Parolanız değiştirildi">
        <Link to="/hesap/giris" className="text-primary underline">
          Yeni parolanızla giriş yapın
        </Link>
      </Notice>
    );
  return (
    <form noValidate className="space-y-3" onSubmit={handler(form)}>
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
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => (
          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            Parolayı değiştir
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
