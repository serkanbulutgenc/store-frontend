import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiErrorToFormErrors } from "../forms/api-errors";
import { bind, Field, FormMessage } from "../forms/field";
import { type SettingsOut, settingsQuery, useUpdateSettings } from "./queries";
import { type SettingsFormValues, settingsFormSchema, toSettingsPatch } from "./schemas";

type Name = keyof SettingsFormValues;
const SECTIONS: {
  title: string;
  fields: { name: Name; label: string; hint?: string; area?: boolean }[];
}[] = [
  {
    title: "Kargo ve ücretler",
    fields: [
      { name: "shipping_fee", label: "Kargo ücreti (₺)" },
      {
        name: "free_shipping_threshold",
        label: "Ücretsiz kargo eşiği (₺)",
        hint: "Boş bırakırsanız ücretsiz kargo kapalıdır.",
      },
      { name: "cod_fee", label: "Kapıda ödeme ücreti (₺)" },
      { name: "fee_kdv_rate", label: "Kargo ve kapıda ödeme KDV oranı (%)" },
      { name: "low_stock_default", label: "Varsayılan düşük stok eşiği" },
    ],
  },
  {
    title: "Banka bilgileri",
    fields: [
      { name: "bank_name", label: "Banka" },
      { name: "bank_account_holder", label: "Hesap sahibi" },
      { name: "bank_iban", label: "IBAN" },
    ],
  },
  {
    title: "Bildirimler",
    fields: [
      {
        name: "notification_emails",
        label: "Bildirim alıcıları",
        hint: "Her satıra bir e-posta.",
        area: true,
      },
    ],
  },
  {
    title: "Ana sayfa afişi",
    fields: [
      { name: "banner_image_url", label: "Görsel adresi" },
      { name: "banner_link", label: "Bağlantı" },
      { name: "banner_alt", label: "Alternatif metin" },
    ],
  },
  {
    title: "Satıcı bilgileri",
    fields: [
      { name: "seller_name", label: "Unvan" },
      { name: "seller_tax_number", label: "Vergi no" },
      { name: "seller_address", label: "Adres", area: true },
      { name: "seller_email", label: "E-posta" },
      { name: "seller_phone", label: "Telefon" },
      { name: "return_carrier", label: "İade kargo firması" },
      { name: "complaint_contact", label: "Şikayet iletişimi" },
    ],
  },
];

function toValues(s: SettingsOut): SettingsFormValues {
  const out = {} as Record<string, string>;
  for (const key of Object.keys(settingsFormSchema.shape)) {
    const v = (s as Record<string, unknown>)[key];
    out[key] = v == null ? "" : String(v);
  }
  out.notification_emails = s.notification_emails.join("\n");
  return out as SettingsFormValues;
}

export function SettingsScreen() {
  const { data } = useSuspenseQuery(settingsQuery);
  const update = useUpdateSettings();
  const form = useForm({
    defaultValues: toValues(data),
    validators: {
      onSubmitAsync: async ({ value }) => {
        const parsed = settingsFormSchema.safeParse(value);
        if (!parsed.success) {
          const fields: Record<string, string> = {};
          for (const i of parsed.error.issues) {
            const k = String(i.path[0] ?? "");
            if (k && !fields[k]) fields[k] = i.message;
          }
          return { form: "Bazı alanlar geçersiz.", fields };
        }
        try {
          const saved = await update.mutateAsync(toSettingsPatch(parsed.data));
          form.reset(toValues(saved));
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        return undefined;
      },
    },
    onSubmit: () => toast.success("Ayarlar kaydedildi."),
  });

  const versions = Object.entries(data.legal_versions);
  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <h1 className="text-lg font-semibold">Ayarlar</h1>
      {SECTIONS.map((section) => (
        <section key={section.title} className="space-y-3">
          <h2 className="text-base font-semibold">{section.title}</h2>
          {section.fields.map((spec) => (
            <form.Field key={spec.name} name={spec.name}>
              {(f) => (
                <Field field={f} label={spec.label} hint={spec.hint}>
                  {spec.area ? (
                    <textarea
                      rows={3}
                      className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-red-600"
                      {...bind(f)}
                    />
                  ) : (
                    <Input {...bind(f)} />
                  )}
                </Field>
              )}
            </form.Field>
          ))}
        </section>
      ))}
      <Section title="Yasal metin sürümleri">
        {versions.length === 0 ? (
          <p className="text-muted-foreground">Sürüm yok.</p>
        ) : (
          <dl className="space-y-1">
            {versions.map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="w-48 text-muted-foreground">{k}</dt>
                <dd className="font-mono text-xs">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Section>
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
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
