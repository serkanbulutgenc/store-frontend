import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { type PublicSettings, settingsQuery } from "@/features/basket/queries";
import { NotifyMe } from "./notify-me";
import { StockAlertLinkPage } from "./stock-alert-link-page";

const router = createRouter({
  routeTree: createRootRoute(),
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

function render(node: ReactNode, settings?: { stock_alerts_enabled: boolean }) {
  const client = new QueryClient();
  if (settings) client.setQueryData(settingsQuery.queryKey, settings as PublicSettings);
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <RouterContextProvider router={router}>{node}</RouterContextProvider>
    </QueryClientProvider>,
  );
}

describe("NotifyMe", () => {
  it("offers Haber ver when the Store setting is on", () => {
    const out = render(<NotifyMe productSlug="elbise" variantId={7} />, {
      stock_alerts_enabled: true,
    });

    expect(out).toMatch(/<button[^>]*>Haber ver<\/button>/);
  });

  it("renders nothing while the setting is off", () => {
    const off = render(<NotifyMe productSlug="elbise" variantId={7} />, {
      stock_alerts_enabled: false,
    });

    expect(off).toBe("");
  });

  it("renders nothing before the settings have loaded", () => {
    expect(render(<NotifyMe productSlug="elbise" variantId={7} />)).toBe("");
  });

  it("opens no form, and asks for no email, until the Shopper asks", () => {
    const out = render(<NotifyMe productSlug="elbise" variantId={7} />, {
      stock_alerts_enabled: true,
    });

    expect(out).not.toContain("<form");
    expect(out).not.toContain('type="checkbox"');
  });
});

describe("StockAlertLinkPage", () => {
  it("waits for the button press: the page alone does not consent or reject", () => {
    const confirm = render(<StockAlertLinkPage action="confirm" token="abc" />);
    const reject = render(<StockAlertLinkPage action="reject" token="abc" />);

    expect(confirm).toMatch(/<button[^>]*>Onayla<\/button>/);
    expect(reject).toMatch(/<button[^>]*>Vazgeç<\/button>/);
  });

  it("shows the invalid-link state, and no button, when the token is missing", () => {
    const out = render(<StockAlertLinkPage action="confirm" token={undefined} />);

    expect(out).toContain("geçersiz veya süresi dolmuş");
    expect(out).not.toContain("<button");
  });
});
