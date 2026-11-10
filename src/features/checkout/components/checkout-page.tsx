import { type AnyFieldApi, useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkoutPrefill } from "@/features/account/prefill";
import { accountQuery, addressesQuery } from "@/features/account/queries";
import { apiErrorToFormErrors } from "@/features/admin/forms/api-errors";
import { bind, Field, FormMessage } from "@/features/admin/forms/field";
import { problemText } from "@/features/basket/problems";
import { basketQuery, settingsQuery } from "@/features/basket/queries";
import { LEGAL_PAGES } from "@/features/legal/pages";
import { formatTry } from "@/lib/format";
import { cn } from "@/lib/utils";
import { suggestEmail } from "../email-hint";
import { previewFees } from "../fees";
import { usePlaceOrder } from "../queries";
import { checkoutSchema, emptyCheckout, toCheckoutBody } from "../schemas";

function useCheckoutForm(
  submit: (body: ReturnType<typeof toCheckoutBody>) => Promise<void>,
  legalVersions: Record<string, string>,
) {
  return useForm({
    defaultValues: emptyCheckout,
    validators: {
      onSubmit: checkoutSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await submit(toCheckoutBody(value, legalVersions));
          return undefined;
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
      },
    },
  });
}

type CheckoutForm = ReturnType<typeof useCheckoutForm>;

function AddressFields({
  prefix,
  form,
}: {
  prefix: "shipping_address" | "billing_address";
  form: CheckoutForm;
}) {
  const parts = [
    ["il", "İl"],
    ["ilce", "İlçe"],
    ["mahalle", "Mahalle"],
    ["street", "Cadde, sokak, bina ve daire no"],
    ["postal_code", "Posta kodu (isteğe bağlı)"],
  ] as const;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {parts.map(([name, label]) => (
        <form.Field key={name} name={`${prefix}.${name}`}>
          {(field: AnyFieldApi) => (
            <div className={name === "street" ? "sm:col-span-2" : undefined}>
              <Field field={field} label={label}>
                <Input
                  {...bind(field)}
                  autoComplete={`${prefix === "shipping_address" ? "shipping" : "billing"} ${name}`}
                  className="h-11"
                />
              </Field>
            </div>
          )}
        </form.Field>
      ))}
    </div>
  );
}

function Check({ field, children }: { field: AnyFieldApi; children: React.ReactNode }) {
  const error = field.state.meta.errors[0];
  return (
    <div>
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          id={field.name}
          name={field.name}
          checked={Boolean(field.state.value)}
          onChange={(e) => field.handleChange(e.target.checked)}
          aria-invalid={Boolean(error)}
          className="mt-1 size-4 accent-primary"
        />
        <span>{children}</span>
      </label>
      {error && (
        <span className="block text-red-700">
          {typeof error === "string" ? error : (error as { message?: string }).message}
        </span>
      )}
    </div>
  );
}

export function CheckoutPage() {
  const { data: basket } = useQuery(basketQuery);
  const { data: settings } = useQuery(settingsQuery);
  const qc = useQueryClient();
  const place = usePlaceOrder();
  const navigate = useNavigate();

  const legalVersionsShown = Object.fromEntries(LEGAL_PAGES.map((p) => [p.key, p.version]));
  const form = useCheckoutForm(async (body) => {
    await place.mutateAsync(body);
    await navigate({ to: "/siparis-onayi" });
    // Only now that the page is gone is it safe to drop the consumed basket.
    qc.removeQueries({ queryKey: basketQuery.queryKey });
  }, legalVersionsShown);

  // A signed-in Customer gets contact details and the default address filled in, once, and
  // only into fields they have not touched.
  const { data: account } = useQuery(accountQuery);
  const { data: book } = useQuery({ ...addressesQuery, enabled: Boolean(account) });
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !account || !book) return;
    prefilled.current = true;
    for (const [name, value] of Object.entries(checkoutPrefill(account, book))) {
      const key = name as keyof typeof emptyCheckout;
      if (!form.getFieldMeta(key)?.isDirty) form.setFieldValue(key, value as never);
    }
  }, [account, book, form]);

  if (!basket || !settings)
    return (
      <main className="mx-auto max-w-5xl px-4 py-8" aria-busy="true">
        <h1 className="mb-4 text-2xl font-semibold">Ödeme</h1>
        <div className="h-48 animate-pulse rounded-md bg-muted" />
      </main>
    );

  if (basket.lines.length === 0)
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">Ödeme</h1>
        <p>Sepetiniz boş.</p>
        <Link to="/ara" className={cn(buttonVariants())}>
          Alışverişe başla
        </Link>
      </main>
    );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Ödeme</h1>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        className="gap-10 lg:grid lg:grid-cols-[1fr_22rem]"
      >
        <div className="space-y-8">
          <section className="space-y-3" aria-labelledby="contact">
            <h2 id="contact" className="text-lg font-semibold">
              İletişim bilgileri
            </h2>
            <form.Field name="full_name">
              {(field) => (
                <Field field={field} label="Ad soyad">
                  <Input {...bind(field)} autoComplete="name" className="h-11" />
                </Field>
              )}
            </form.Field>
            <form.Field name="email">
              {(field) => {
                const hint = suggestEmail(field.state.value);
                return (
                  <Field field={field} label="E-posta">
                    <Input {...bind(field)} type="email" autoComplete="email" className="h-11" />
                    {hint && (
                      <span className="block text-muted-foreground">
                        Bunu mu demek istediniz?{" "}
                        <button
                          type="button"
                          className="text-primary underline"
                          onClick={() => field.handleChange(hint)}
                        >
                          {hint}
                        </button>
                      </span>
                    )}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="phone">
              {(field) => (
                <Field field={field} label="Telefon" hint="Kargo teslimatı için gereklidir.">
                  <Input {...bind(field)} type="tel" autoComplete="tel" className="h-11" />
                </Field>
              )}
            </form.Field>
            <p className="text-muted-foreground">
              Kişisel verileriniz siparişinizi işlemek için kullanılır.{" "}
              <Link
                to="/yasal/$slug"
                params={{ slug: "gizlilik-ve-kvkk" }}
                className="text-primary underline"
              >
                Gizlilik ve KVKK aydınlatma metni
              </Link>
            </p>
          </section>

          <section className="space-y-3" aria-labelledby="shipping">
            <h2 id="shipping" className="text-lg font-semibold">
              Teslimat adresi
            </h2>
            <AddressFields prefix="shipping_address" form={form} />
            <form.Field name="billing_different">
              {(field) => <Check field={field}>Fatura adresim teslimat adresimden farklı</Check>}
            </form.Field>
            <form.Subscribe selector={(s) => s.values.billing_different}>
              {(different) => different && <AddressFields prefix="billing_address" form={form} />}
            </form.Subscribe>
          </section>

          <section className="space-y-3" aria-labelledby="payment">
            <h2 id="payment" className="text-lg font-semibold">
              Ödeme yöntemi
            </h2>
            <form.Field name="payment_method">
              {(field) => (
                <div role="radiogroup" aria-labelledby="payment" className="space-y-2">
                  {(
                    [
                      [
                        "bank_transfer",
                        "Havale / EFT",
                        "Sipariş sonrası banka bilgileri gösterilir. 48 saat içinde ödeme yapılmazsa sipariş iptal edilir.",
                      ],
                      [
                        "cod",
                        "Kapıda ödeme",
                        `Kapıda ödeme bedeli: ${formatTry(settings.cod_fee)}`,
                      ],
                    ] as const
                  ).map(([value, label, note]) => (
                    <label
                      key={value}
                      className="flex items-start gap-2 rounded-md border border-border bg-card p-3"
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={value}
                        checked={field.state.value === value}
                        onChange={() => field.handleChange(value)}
                        className="mt-1 accent-primary"
                      />
                      <span>
                        <span className="block font-medium">{label}</span>
                        <span className="block text-muted-foreground">{note}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </form.Field>
            <form.Subscribe selector={(s) => s.values.payment_method}>
              {(method) =>
                method === "cod" && (
                  <form.Field name="cod_fee_consent">
                    {(field) => (
                      <Check field={field}>
                        Kapıda ödeme bedeli olan {formatTry(settings.cod_fee)} tutarını siparişime
                        eklenmesini kabul ediyorum.
                      </Check>
                    )}
                  </form.Field>
                )
              }
            </form.Subscribe>
          </section>
        </div>

        <aside
          className="relative mt-8 h-fit space-y-4 rounded-md border border-border bg-card p-4 lg:mt-0"
          aria-labelledby="summary"
        >
          <h2 id="summary" className="text-lg font-semibold">
            Sipariş özeti
          </h2>
          <ul className="space-y-2">
            {basket.lines.map((l) => {
              const problem = problemText(l);
              return (
                <li key={l.id}>
                  <div className="flex justify-between gap-2">
                    <span>
                      {l.quantity} × {l.title}
                      <span className="block text-muted-foreground">
                        {l.colour.name} · {l.size}
                      </span>
                    </span>
                    <span>{formatTry(l.line_total)}</span>
                  </div>
                  {problem && (
                    <p role="alert" className="text-red-700">
                      {problem}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <form.Subscribe selector={(s) => s.values.payment_method}>
            {(method) => {
              const fees = previewFees(basket.subtotal, settings, method);
              return (
                <dl className="space-y-1 border-t border-border pt-3">
                  <div className="flex justify-between">
                    <dt>Ürünler (KDV dahil)</dt>
                    <dd>{formatTry(basket.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Kargo</dt>
                    <dd>{fees.freeShipping ? "Ücretsiz" : formatTry(fees.shipping)}</dd>
                  </div>
                  {method === "cod" && (
                    <div className="flex justify-between">
                      <dt>Kapıda ödeme bedeli</dt>
                      <dd>{formatTry(fees.cod)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold">
                    <dt>Toplam</dt>
                    <dd>{formatTry(fees.total)}</dd>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Ödeme yöntemi</dt>
                    <dd>{method === "cod" ? "Kapıda ödeme" : "Havale / EFT"}</dd>
                  </div>
                </dl>
              );
            }}
          </form.Subscribe>
          <p className="rounded-md bg-muted px-3 py-2 text-muted-foreground">
            Teslimattan itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz. Hijyen nedeniyle
            ambalajı açılmış iç giyim ürünleri iade edilemez.{" "}
            <Link
              to="/yasal/$slug"
              params={{ slug: "iade-ve-cayma-kosullari" }}
              className="text-primary underline"
            >
              Ayrıntılar
            </Link>
          </p>

          <form.Field name="contract_acknowledged">
            {(field) => (
              <Check field={field}>
                <Link
                  to="/yasal/$slug"
                  params={{ slug: "mesafeli-satis-sozlesmesi" }}
                  target="_blank"
                  className="text-primary underline"
                >
                  Mesafeli satış sözleşmesini
                </Link>{" "}
                ve{" "}
                <Link
                  to="/yasal/$slug"
                  params={{ slug: "on-bilgilendirme-formu" }}
                  target="_blank"
                  className="text-primary underline"
                >
                  ön bilgilendirme formunu
                </Link>{" "}
                okudum, onaylıyorum.
              </Check>
            )}
          </form.Field>
          <form.Field name="marketing_consent">
            {(field) => (
              <Check field={field}>
                Kampanya ve yeniliklerden e-posta ile haberdar olmak istiyorum (isteğe bağlı).
              </Check>
            )}
          </form.Field>

          {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
          <div aria-hidden="true" className="absolute size-px overflow-hidden opacity-0">
            <form.Field name="website">
              {(field) => (
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>
          </div>

          <form.Subscribe selector={(s) => ({ errors: s.errors, submitting: s.isSubmitting })}>
            {({ errors, submitting }) => (
              <>
                <FormMessage error={errors[0]} />
                <Button
                  type="submit"
                  size="lg"
                  className="h-auto w-full whitespace-normal py-3"
                  disabled={submitting || basket.has_problems}
                >
                  Siparişi onayla ve ödeme yükümlülüğü oluştur
                </Button>
              </>
            )}
          </form.Subscribe>
        </aside>
      </form>
    </main>
  );
}
