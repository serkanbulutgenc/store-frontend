import { createFileRoute } from "@tanstack/react-router";
import { seoHandler } from "@/lib/api/seo-proxy";

export const Route = createFileRoute("/sitemap.xml")({
  server: { handlers: { GET: seoHandler("/sitemap.xml") } },
});
