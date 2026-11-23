import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { contactCategoriesQuery, useSubmitContact } from "../queries";
import {
  type ContactErrors,
  type ContactValues,
  contactErrors,
  MESSAGE_MAX,
  NAME_MAX,
  ORDER_NUMBER_MAX,
  SUCCESS_TEXT,
  SUCCESS_TITLE,
  submitProblem,
} from "../rules";

const EMPTY: ContactValues = {
  categoryId: null,
  name: "",
  email: "",
  orderNumber: "",
  message: "",
};

export function Sent() {
  return (
    <section role="status" className="space-y-2 rounded-md border border-border bg-card p-4">
      <h2 className="text-lg font-semibold">{SUCCESS_TITLE}</h2>
      <p>{SUCCESS_TEXT}</p>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      {children}
      {hint && (
        <span id={`${id}-hint`} className="block text-muted-foreground">
          {hint}
        </span>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** The contact form. `categories` is what the Shopper may pick; nothing is kept on the page after sending. */
export function ContactForm({
  categories,
  onSent,
}: {
  categories: { id: number; name: string }[];
  onSent: () => void;
}) {
  const send = useSubmitContact();
  const [values, setValues] = useState<ContactValues>(EMPTY);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [general, setGeneral] = useState<string | null>(null);
  const set = <K extends keyof ContactValues>(key: K, value: ContactValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const described = (id: string, hint: boolean, error?: string) =>
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") ||
    undefined;
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const found = contactErrors(values);
        setErrors(found);
        setGeneral(null);
        if (Object.keys(found).length > 0 || values.categoryId === null) return;
        send.mutate(
          { ...values, categoryId: values.categoryId, website },
          {
            onSuccess: onSent,
            onError: (error) => {
              const problem = submitProblem(error);
              setErrors(problem.fields);
              setGeneral(problem.general);
            },
          },
        );
      }}
    >
      <Field id="contact-category" label="Konu" error={errors.category}>
        <Select
          id="contact-category"
          className="h-11"
          required
          aria-invalid={!!errors.category}
          aria-describedby={described("contact-category", false, errors.category)}
          value={values.categoryId ?? ""}
          onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Seçin</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="contact-name" label="Adınız" error={errors.name}>
        <Input
          id="contact-name"
          className="h-11"
          autoComplete="name"
          required
          maxLength={NAME_MAX}
          aria-invalid={!!errors.name}
          aria-describedby={described("contact-name", false, errors.name)}
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </Field>
      <Field
        id="contact-email"
        label="E-posta"
        hint="Yanıtı bu adrese göndereceğiz."
        error={errors.email}
      >
        <Input
          id="contact-email"
          type="email"
          className="h-11"
          autoComplete="email"
          required
          aria-invalid={!!errors.email}
          aria-describedby={described("contact-email", true, errors.email)}
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </Field>
      <Field
        id="contact-order"
        label="Sipariş numarası (isteğe bağlı)"
        hint="Bir siparişle ilgiliyse yazın, size daha hızlı yardımcı olalım."
        error={errors.order_number}
      >
        <Input
          id="contact-order"
          className="h-11"
          autoComplete="off"
          placeholder="AT-ABC123"
          maxLength={ORDER_NUMBER_MAX}
          aria-invalid={!!errors.order_number}
          aria-describedby={described("contact-order", true, errors.order_number)}
          value={values.orderNumber}
          onChange={(e) => set("orderNumber", e.target.value)}
        />
      </Field>
      <Field id="contact-message" label="Mesajınız" error={errors.message}>
        <Textarea
          id="contact-message"
          rows={6}
          required
          maxLength={MESSAGE_MAX + 50}
          aria-invalid={!!errors.message}
          aria-describedby={described("contact-message", false, errors.message)}
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
        />
      </Field>
      {/* The honeypot: out of sight and out of the tab order. A person never fills it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Bu alanı boş bırakın</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      {general && (
        <p role="alert" className="rounded-md bg-muted px-3 py-2 text-red-700">
          {general}
        </p>
      )}
      <Button type="submit" size="lg" disabled={send.isPending}>
        {send.isPending ? "Gönderiliyor…" : "Gönder"}
      </Button>
    </form>
  );
}

export function ContactPage() {
  const { data: categories = [] } = useQuery(contactCategoriesQuery());
  const [sent, setSent] = useState(false);
  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">İletişim</h1>
      {sent ? (
        <Sent />
      ) : (
        <>
          <p className="text-muted-foreground">
            Sorularınızı ve taleplerinizi yazın; yanıtımızı e-posta ile ileteceğiz.
          </p>
          <ContactForm categories={categories} onSent={() => setSent(true)} />
        </>
      )}
    </main>
  );
}
