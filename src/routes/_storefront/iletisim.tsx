import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/features/contact/components/contact-page";
import { contactCategoriesQuery } from "@/features/contact/queries";

export const Route = createFileRoute("/_storefront/iletisim")({
  head: () => ({ meta: [{ title: "İletişim | Auraa Giyim" }] }),
  loader: ({ context }) => context.queryClient.query(contactCategoriesQuery()),
  component: ContactPage,
});
