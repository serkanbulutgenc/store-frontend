import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { accountQuery } from "@/features/account/queries";
import { settingsQuery } from "@/features/basket/queries";
import { subscribeProblem } from "../messages";
import { useSubscribeStockAlert } from "../queries";

type Status = "confirmed" | "confirmation_sent";

/**
 * "Haber ver" on a sold-out Size: email (a signed-in Shopper has an account email, so no
 * field), the unticked consent box with the privacy notice, and the result. Renders nothing
 * while the Store setting is off. The consent wording is a placeholder until #90.
 */
export function NotifyMe({ productSlug, variantId }: { productSlug: string; variantId: number }) {
  const { data: settings } = useQuery(settingsQuery);
  if (!settings?.stock_alerts_enabled) return null;
  // Keyed so picking another sold-out Size starts a fresh form rather than showing the last result.
  return <NotifyForm key={variantId} productSlug={productSlug} variantId={variantId} />;
}

function NotifyForm({ productSlug, variantId }: { productSlug: string; variantId: number }) {
  const id = useId();
  const { data: account } = useQuery(accountQuery);
  const subscribe = useSubscribeStockAlert(productSlug);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [done, setDone] = useState<Status | null>(null);

  const problem = subscribe.isError ? subscribeProblem(subscribe.error) : null;

  if (done) {
    return (
      <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm">
        {done === "confirmed"
          ? "Kaydedildi. Bu beden stoğa girince e-posta ile haber vereceğiz."
          : "E-postanıza bir onay bağlantısı gönderdik. Bağlantıya tıkladığınızda kaydınız tamamlanır."}
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        aria-expanded={false}
        aria-controls={id}
        onClick={() => setOpen(true)}
      >
        Haber ver
      </Button>
    );
  }

  return (
    <form
      id={id}
      noValidate
      className="space-y-3 rounded-md border border-border p-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (!consent) {
          setConsentError(true);
          return;
        }
        subscribe.mutate(
          { variantId, email: account ? "" : email.trim() },
          { onSuccess: (r) => setDone(r.status) },
        );
      }}
    >
      <p className="font-medium">Bu beden stoğa girince bir kez e-posta gönderelim.</p>
      {account ? (
        <p className="text-muted-foreground">
          Bildirim <span className="font-medium text-foreground">{account.email}</span> adresine
          gönderilir.
        </p>
      ) : (
        <div className="space-y-1">
          <label htmlFor={`${id}-email`} className="block font-medium">
            E-posta
          </label>
          <Input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(problem?.email)}
            aria-describedby={problem?.email ? `${id}-email-error` : undefined}
            className="h-11"
          />
          {problem?.email && (
            <p id={`${id}-email-error`} role="alert" className="text-red-700">
              {problem.email}
            </p>
          )}
        </div>
      )}
      <div>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              setConsentError(false);
            }}
            aria-invalid={consentError}
            aria-describedby={consentError ? `${id}-consent-error` : undefined}
            className="mt-1 size-4 accent-primary"
          />
          <span>
            Bu ürün stoğa girdiğinde bana ticari elektronik ileti olarak e-posta gönderilmesini
            kabul ediyorum.{" "}
            <Link
              to="/yasal/$slug"
              params={{ slug: "gizlilik-ve-kvkk" }}
              className="text-primary underline"
            >
              Gizlilik ve KVKK aydınlatma metni
            </Link>
          </span>
        </label>
        {consentError && (
          <p id={`${id}-consent-error`} role="alert" className="mt-1 text-red-700">
            Devam etmek için onay kutusunu işaretleyin.
          </p>
        )}
      </div>
      {problem && !problem.email && (
        <p role="alert" className="text-red-700">
          {problem.message}
        </p>
      )}
      <Button type="submit" disabled={subscribe.isPending}>
        Haber ver
      </Button>
    </form>
  );
}
