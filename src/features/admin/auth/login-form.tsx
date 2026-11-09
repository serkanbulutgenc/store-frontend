import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ME_KEY } from "@/lib/api/me-query";
import { apiErrorToFormErrors } from "../forms/api-errors";
import { bind, Field, FormMessage } from "../forms/field";
import { authenticateTotp, login } from "./allauth";

const credentials = z.object({
  email: z.email("Geçerli bir e-posta girin."),
  password: z.string().min(1, "Parolayı girin."),
});
const totp = z.object({ code: z.string().regex(/^\d{6}$/, "6 haneli kodu girin.") });

/** Step 1: email and password. */
function CredentialsStep({ onDone, onMfa }: { onDone: () => void; onMfa: () => void }) {
  // The validator only reports errors; what to do on success runs in `onSubmit`, after the
  // form has finished submitting and before any navigation or unmount.
  const result = useRef<"done" | "mfa">("done");
  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: {
      onSubmit: credentials,
      onSubmitAsync: async ({ value }) => {
        try {
          result.current = await login(value.email, value.password);
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        return undefined;
      },
    },
    onSubmit: () => (result.current === "mfa" ? onMfa() : onDone()),
  });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="email">
        {(f) => (
          <Field field={f} label="E-posta">
            <Input type="email" autoComplete="username" {...bind(f)} />
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
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => <FormMessage error={err} />}
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => (
          <Button type="submit" disabled={submitting} className="w-full">
            Giriş yap
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

/** Step 2: the TOTP code. */
function CodeStep({ onDone }: { onDone: () => void }) {
  const form = useForm({
    defaultValues: { code: "" },
    validators: {
      onSubmit: totp,
      onSubmitAsync: async ({ value }) => {
        try {
          await authenticateTotp(value.code);
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        return undefined;
      },
    },
    onSubmit: () => onDone(),
  });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <p className="text-muted-foreground">Doğrulama uygulamanızdaki 6 haneli kodu girin.</p>
      <form.Field name="code">
        {(f) => (
          <Field field={f} label="Doğrulama kodu">
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
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
          <Button type="submit" disabled={submitting} className="w-full">
            Doğrula
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  // The session cookie is set by the proxy; re-running the guards loads `/me` and redirects.
  async function done() {
    try {
      queryClient.removeQueries({ queryKey: ME_KEY }); // the cached signed-out answer is stale now
      await router.invalidate();
      await router.navigate({ href: redirectTo });
    } catch {
      toast.error("Giriş yapıldı ancak sayfa yüklenemedi. Lütfen sayfayı yenileyin.");
    }
  }
  return step === "credentials" ? (
    <CredentialsStep onDone={done} onMfa={() => setStep("mfa")} />
  ) : (
    <CodeStep onDone={done} />
  );
}
