import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CircleAlert, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorToFormErrors } from "../forms/api-errors";
import { bind, Field, FormMessage } from "../forms/field";
import { type SettingsOut, settingsQuery, useUpdateSettings } from "./queries";
import { type SettingsFormValues, settingsFormSchema, toSettingsPatch } from "./schemas";
import { SETTINGS_TABS, tabsWithErrors } from "./tabs";

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
  const [tab, setTab] = useState(SETTINGS_TABS[0]?.id ?? "");
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
          showFirstInvalidTab(fields);
          return { form: "Bazı alanlar geçersiz.", fields };
        }
        try {
          const saved = await update.mutateAsync(toSettingsPatch(parsed.data));
          form.reset(toValues(saved));
        } catch (e) {
          const errors = apiErrorToFormErrors(e);
          showFirstInvalidTab(errors.fields ?? {});
          return errors;
        }
        return undefined;
      },
    },
    onSubmit: () => toast.success("Ayarlar kaydedildi."),
  });

  /** Keep the Owner on a tab that shows an error, so a failed save is never silent. */
  function showFirstInvalidTab(fields: Record<string, string>) {
    const bad = tabsWithErrors(SETTINGS_TABS, (name) => name in fields);
    const current = SETTINGS_TABS.find((t) => t.id === tab);
    if (current && bad.has(current.id)) return;
    const first = SETTINGS_TABS.find((t) => bad.has(t.id));
    if (first) setTab(first.id);
  }

  const versions = Object.entries(data.legal_versions);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <h1 className="flex items-center gap-2 text-lg font-semibold">Ayarlar</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto">
          <form.Subscribe selector={(s) => s.fieldMeta}>
            {(meta) => {
              const bad = tabsWithErrors(
                SETTINGS_TABS,
                (name) => (meta[name]?.errors.length ?? 0) > 0,
              );
              return (
                <TabsList variant="line">
                  {SETTINGS_TABS.map((t) => (
                    <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                      <t.icon aria-hidden className="size-4" />
                      {t.label}
                      {bad.has(t.id) && (
                        <>
                          <CircleAlert aria-hidden className="size-4 text-red-700" />
                          <span className="sr-only">Geçersiz alan var</span>
                        </>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              );
            }}
          </form.Subscribe>
        </div>
        {SETTINGS_TABS.map((t) => (
          // Inactive panels stay mounted so a hidden field is still validated and can show its error.
          <TabsContent
            key={t.id}
            value={t.id}
            forceMount
            className="max-w-2xl space-y-3 data-[state=inactive]:hidden"
          >
            {t.fields.map((spec) => (
              <form.Field key={spec.name} name={spec.name}>
                {(f) => (
                  <Field field={f} label={spec.label} hint={spec.hint}>
                    {spec.area ? <Textarea rows={3} {...bind(f)} /> : <Input {...bind(f)} />}
                  </Field>
                )}
              </form.Field>
            ))}
            {t.id === "legal" &&
              (versions.length === 0 ? (
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
              ))}
          </TabsContent>
        ))}
      </Tabs>
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => <FormMessage error={err} />}
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => (
          <Button type="submit" disabled={submitting}>
            <Save aria-hidden className="size-4" />
            Kaydet
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
