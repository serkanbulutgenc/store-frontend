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
import { authenticateTotp, login } from "./allauth";

const credentials = z.object({
  email: z.email("Geçerli bir e-posta girin."),
  password: z.string().min(1, "Parolayı girin."),
});
const totp = z.object({ code: z.string().regex(/^\d{6}$/, "6 haneli kodu girin.") });

/** Step 1: email and password. Returns to the caller with `"mfa"` when 2FA is pending. */
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
        {(field) => (
          <Labelled id="email" label="E-posta" errors={field.state.meta.errors}>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={field.state.meta.errors.length > 0}
            />
          </Labelled>
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <Labelled id="password" label="Parola" errors={field.state.meta.errors}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={field.state.meta.errors.length > 0}
            />
          </Labelled>
        )}
      </form.Field>
      <FormError form={form} />
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
        {(field) => (
          <Labelled id="code" label="Doğrulama kodu" errors={field.state.meta.errors}>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={field.state.meta.errors.length > 0}
            />
          </Labelled>
        )}
      </form.Field>
      <FormError form={form} />
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

function Labelled({
  id,
  label,
  errors,
  children,
}: {
  id: string;
  label: string;
  errors: unknown[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      {children}
      {errors.length > 0 && <span className="block text-red-700">{errorText(errors[0])}</span>}
    </div>
  );
}

function errorText(e: unknown): string {
  return typeof e === "string"
    ? e
    : ((e as { message?: string } | null)?.message ?? "Geçersiz değer.");
}

function FormError({
  form,
}: {
  form: {
    Subscribe: React.ComponentType<{
      selector: (s: { errorMap: Record<string, unknown> }) => unknown;
      children: (v: unknown) => React.ReactNode;
    }>;
  };
}) {
  return (
    <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
      {(err) => {
        const e = err as { form?: string; fields?: Record<string, string> } | string | undefined;
        const msg = typeof e === "string" ? e : (e?.form ?? null);
        // A field that already shows this exact message does not need it repeated.
        const repeated =
          typeof e === "object" && Object.values(e?.fields ?? {}).includes(msg ?? "");
        return msg && !repeated ? (
          <p role="alert" className="text-red-700">
            {msg}
          </p>
        ) : null;
      }}
    </form.Subscribe>
  );
}
