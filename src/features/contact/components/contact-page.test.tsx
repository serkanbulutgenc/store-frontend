import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContactForm, Sent } from "./contact-page";

const render = (node: React.ReactNode) =>
  renderToString(<QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>);

const categories = [
  { id: 1, name: "Sipariş sorusu" },
  { id: 2, name: "İade" },
];

describe("ContactForm", () => {
  const out = render(<ContactForm categories={categories} onSent={() => {}} />);

  it("labels every field and lists the categories", () => {
    for (const label of [
      "Konu",
      "Adınız",
      "E-posta",
      "Sipariş numarası (isteğe bağlı)",
      "Mesajınız",
    ])
      expect(out).toContain(label);
    expect(out).toContain("Sipariş sorusu");
    expect(out).toContain("İade");
  });

  it("hides the honeypot from sight, assistive technology and the tab order", () => {
    const honeypot = out.match(/<div aria-hidden="true"[^>]*>.*?<\/div>/s)?.[0] ?? "";
    expect(honeypot).toContain('name="website"');
    expect(honeypot).toContain('tabindex="-1"');
    expect(honeypot).toContain("-left-[9999px]");
  });

  it("marks the order number optional and the rest required", () => {
    expect(out).toContain("isteğe bağlı");
    expect(out.match(/required=""/g)).toHaveLength(4);
  });
});

describe("Sent", () => {
  it("says the reply comes by email", () => {
    const out = render(<Sent />);
    expect(out).toContain("Mesajınız bize ulaştı");
    expect(out).toContain("e-posta ile");
    expect(out).toContain('role="status"');
  });
});
