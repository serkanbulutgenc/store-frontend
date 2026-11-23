import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiErrorToFormErrors } from "../forms/api-errors";
import { bind, Field, FormMessage } from "../forms/field";
import { useChangeLegalSlug } from "./queries";
import { slugFormSchema } from "./schemas";

/** The earlier addresses of a page. Each one still opens the page, at its current address. */
export function LegalRedirects({ redirects }: { redirects: string[] }) {
  if (redirects.length === 0)
    return <p className="text-muted-foreground">Henüz eski bir adres yok.</p>;
  return (
    <ul className="divide-y rounded-md border">
      {redirects.map((slug) => (
        <li key={slug} className="px-3 py-2 font-mono text-xs">
          /yasal/{slug}
        </li>
      ))}
    </ul>
  );
}

/** Owner only: change the page's address on the Storefront. The old one redirects to it. */
export function LegalSlugEditor({
  page,
  slug,
  redirects,
  owner,
}: {
  page: string;
  slug: string;
  redirects: string[];
  owner: boolean;
}) {
  if (!owner) return null;
  return <SlugForm page={page} slug={slug} redirects={redirects} />;
}

function SlugForm({ page, slug, redirects }: { page: string; slug: string; redirects: string[] }) {
  const change = useChangeLegalSlug(page);
  const form = useForm({
    defaultValues: { slug },
    validators: {
      onSubmitAsync: async ({ value }) => {
        const parsed = slugFormSchema.safeParse(value);
        if (!parsed.success) {
          return {
            form: "Formdaki hataları düzeltin.",
            fields: { slug: parsed.error.issues[0]?.message },
          };
        }
        if (
          !window.confirm(
            `Adres /yasal/${parsed.data.slug} olsun mu? Eski adres bu sayfaya yönlendirmeye devam eder; menüler değişmez.`,
          )
        )
          return undefined;
        try {
          const saved = await change.mutateAsync(parsed.data.slug);
          form.reset({ slug: saved.slug });
          toast.success("Adres değiştirildi.");
          return undefined;
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
      },
    },
  });

  return (
    <section aria-label="Adres" className="space-y-3">
      <h2 className="font-medium">Adres</h2>
      <form
        className="max-w-md space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field name="slug">
          {(f) => (
            <Field
              field={f}
              label="Adres"
              hint="Küçük harf, rakam ve tire. Mağazada /yasal/adres olarak açılır."
            >
              <Input {...bind(f)} />
            </Field>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
          {(err) => <FormMessage error={err} />}
        </form.Subscribe>
        <form.Subscribe selector={(s) => ({ v: s.values.slug, submitting: s.isSubmitting })}>
          {({ v, submitting }) => (
            <Button type="submit" size="sm" disabled={submitting || v.trim() === slug}>
              Adresi değiştir
            </Button>
          )}
        </form.Subscribe>
      </form>
      <div className="space-y-1">
        <h3 className="text-muted-foreground">Eski adresler (yeni adrese yönlendirir)</h3>
        <LegalRedirects redirects={redirects} />
      </div>
    </section>
  );
}
