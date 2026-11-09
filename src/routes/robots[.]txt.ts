import { createFileRoute } from "@tanstack/react-router";
import { seoHandler } from "@/lib/api/seo-proxy";

export const Route = createFileRoute("/robots.txt")({
  server: { handlers: { GET: seoHandler("/robots.txt") } },
});
