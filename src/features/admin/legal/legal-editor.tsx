import { useForm } from "@tanstack/react-form";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/features/legal/markdown";
import { formatDate } from "@/lib/format";
import { useCrumbLabel } from "../components/crumb-labels";
import { apiErrorToFormErrors } from "../forms/api-errors";
import { bind, Field, FormMessage } from "../forms/field";
import { useDirtyGuard } from "../forms/use-dirty-guard";
import {
  type LegalRow,
  legalVersionQuery,
  legalVersionsQuery,
  usePublishLegalPage,
} from "./queries";
import { isUnchanged, legalFormSchema } from "./schemas";

/** Edit one Legal page: the text of the newest version, a live preview, and the history. */
export function LegalEditor({ page }: { page: string }) {
  const { data: versions } = useSuspenseQuery(legalVersionsQuery(page));
  const latest = versions[0] as LegalRow;
  const { data: current } = useSuspenseQuery(legalVersionQuery(page, latest.version));
  const publish = usePublishLegalPage(page);
  const [viewing, setViewing] = useState<number | null>(null);
  useCrumbLabel(page, latest.title);

  const form = useForm({
    defaultValues: { title: current.title, body: current.body },
    validators: {
      onSubmitAsync: async ({ value }) => {
        const parsed = legalFormSchema.safeParse(value);
        if (!parsed.success) {
          const fields: Record<string, string> = {};
          for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
          return { form: "Formdaki hataları düzeltin.", fields };
        }
        const next = latest.version + 1;
        if (
          !window.confirm(
            `Sürüm ${next} olarak kaydedilsin mi? Mağazada hemen yayınlanır; eski sürüm silinmez ama geri alınamaz.`,
          )
        )
          return undefined;
        try {
          const saved = await publish.mutateAsync(parsed.data);
          form.reset({ title: saved.title, body: saved.body });
          toast.success(`Sürüm ${saved.version} yayınlandı.`);
          return undefined;
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
      },
    },
  });
  useDirtyGuard(form.state.isDirty && !form.state.isSubmitting);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">{latest.title}</h1>
      <p className="text-muted-foreground">
        Şu an yayında: sürüm {latest.version} · {formatDate(latest.created_at)}
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field name="title">
            {(f) => (
              <Field field={f} label="Başlık">
                <Input {...bind(f)} />
              </Field>
            )}
          </form.Field>
          <form.Field name="body">
            {(f) => (
              <Field
                field={f}
                label="Metin (Markdown)"
                hint="Başlık için #, liste için - veya 1., kalın için **metin**, bağlantı için [metin](/adres)."
              >
                <Textarea rows={22} className="font-mono text-xs" {...bind(f)} />
              </Field>
            )}
          </form.Field>
          <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
            {(err) => <FormMessage error={err} />}
          </form.Subscribe>
          <form.Subscribe selector={(s) => ({ v: s.values, submitting: s.isSubmitting })}>
            {({ v, submitting }) => {
              const unchanged = isUnchanged(v, current);
              return (
                <div className="flex items-center gap-3">
                  <Button type="submit" size="sm" disabled={submitting || unchanged}>
                    Yeni sürüm olarak yayınla
                  </Button>
                  {unchanged && <span className="text-muted-foreground">Değişiklik yok.</span>}
                </div>
              );
            }}
          </form.Subscribe>
        </form>

        <section aria-label="Önizleme" className="space-y-2">
          <h2 className="font-medium">Önizleme</h2>
          <form.Subscribe selector={(s) => s.values.body}>
            {(body) => (
              <div className="rounded-md border p-4">
                <Markdown source={body} />
              </div>
            )}
          </form.Subscribe>
        </section>
      </div>

      <section aria-label="Sürüm geçmişi" className="space-y-2">
        <h2 className="font-medium">Sürüm geçmişi</h2>
        <ul className="divide-y rounded-md border">
          {versions.map((v) => (
            <li key={v.version} className="flex items-center justify-between gap-3 px-3 py-2">
              <span>
                Sürüm {v.version} · {formatDate(v.created_at)}
                {v.created_by ? ` · ${v.created_by}` : " · ilk yayın"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewing(viewing === v.version ? null : v.version)}
              >
                {viewing === v.version ? "Gizle" : "Görüntüle"}
              </Button>
            </li>
          ))}
        </ul>
        {viewing !== null && <OldVersion page={page} version={viewing} />}
      </section>
    </div>
  );
}

/** A saved version, read-only. */
function OldVersion({ page, version }: { page: string; version: number }) {
  const { data, isPending } = useQuery(legalVersionQuery(page, version));
  if (isPending || !data) return <div className="h-24 animate-pulse rounded-md bg-muted" />;
  return (
    <article className="rounded-md border bg-muted/30 p-4">
      <p className="mb-2 text-muted-foreground">
        Sürüm {data.version} (salt okunur): {data.title}
      </p>
      <Markdown source={data.body} />
    </article>
  );
}
