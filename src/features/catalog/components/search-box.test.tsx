// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SuggestionGroup as Group } from "../queries";
import { SearchBox } from "./search-box";

// The one fake: the network, below the API client.
const { serverFetch } = vi.hoisted(() => ({
  serverFetch: vi.fn<(req: Request) => Promise<Response>>(),
}));
vi.mock("@/lib/api/server-fetch", () => ({ serverFetch }));

type Item = Group["items"][number];

const item = (name: string, path: string, image_url: string | null = null): Item => ({
  name,
  path,
  image_url,
});
const DRESSES: Group[] = [{ type: "category", items: [item("Elbise", "/kategori/elbise")] }];

const answer = (groups: Group[]) => Response.json({ groups });
/** Every request gets these groups. */
const suggest = (groups: Group[]) => serverFetch.mockImplementation(async () => answer(groups));
const requested = () =>
  serverFetch.mock.calls.map(([req]) => new URL(req.url).searchParams.get("q"));

async function open(url = "/") {
  const root = createRootRoute({
    component: () => (
      <>
        <SearchBox />
        <button type="button">Sayfa</button>
        <p>Metin</p>
        <Outlet />
      </>
    ),
  });
  const paths = [
    "/",
    "/ara",
    "/kategori/$slug",
    "/urun/$slug",
    "/collections/$slug",
    "/kampanyalar/$slug",
  ];
  const router = createRouter({
    routeTree: root.addChildren(
      paths.map((path) => createRoute({ getParentRoute: () => root, path })),
    ),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  await router.load();
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await wait(0);
  return {
    router,
    box: screen.getByLabelText<HTMLInputElement>("Ürün ara"),
    user: userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) }),
  };
}

type Router = Awaited<ReturnType<typeof open>>["router"];
type User = Awaited<ReturnType<typeof open>>["user"];
const wait = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
/** The debounce elapses, then the answer arrives (React starts the request between the two). */
const settle = async () => {
  await wait(200);
  await wait(10);
};
const options = () => screen.queryAllByRole("option").map((o) => o.textContent);

beforeEach(() => {
  vi.useFakeTimers();
  // Testing Library only advances fake timers it recognises as Jest's.
  vi.stubGlobal("jest", { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) });
  window.scrollTo = () => {};
  serverFetch.mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Search suggestions", () => {
  it("asks from 2 characters, once typing has stopped for 200 ms, and lists the answer", async () => {
    suggest(DRESSES);
    const { box, user } = await open();

    await user.type(box, "e");
    await wait(1000);
    expect(requested()).toEqual([]);

    await user.type(box, "l");
    await wait(150);
    await user.type(box, "b");
    await wait(199);
    expect(requested()).toEqual([]);

    await wait(1);
    await wait(10);
    expect(requested()).toEqual(["elb"]);
    expect(screen.getByRole("option", { name: /Elbise/ })).toBeTruthy();
  });

  it("cancels a request that typing has overtaken, and ignores its late answer", async () => {
    const pending: { req: Request; reply: (groups: Group[]) => void }[] = [];
    serverFetch.mockImplementation(
      (req) => new Promise((resolve) => pending.push({ req, reply: (g) => resolve(answer(g)) })),
    );
    const { box, user } = await open();

    await user.type(box, "el");
    await wait(250);
    await user.type(box, "b");
    await wait(250);
    expect(pending.map((p) => p.req.signal.aborted)).toEqual([true, false]);

    pending[1]?.reply(DRESSES);
    pending[0]?.reply([{ type: "product", items: [item("El kremi", "/urun/el-kremi")] }]);
    await wait(10);
    expect(options()).toContain("Elbise, Kategori");
    expect(options().join()).not.toContain("El kremi");
  });

  it("groups every type under its heading, in the answer's order, with a picture or a placeholder", async () => {
    suggest([
      { type: "category", items: [item("Çanta", "/kategori/canta", "/media/canta.jpg")] },
      { type: "brand", items: [item("Çınar", "/ara?brand=7")] },
      { type: "collection", items: [item("Yazlık", "/collections/yazlik")] },
      { type: "campaign_page", items: [item("Bahar", "/kampanyalar/bahar")] },
      { type: "product", items: [item("Deri Çanta", "/urun/deri-canta")] },
    ]);
    const { box, user } = await open();
    await user.type(box, "ça");
    await settle();

    const groups = screen.getAllByRole("group");
    const headings = ["Kategoriler", "Markalar", "Koleksiyonlar", "Kampanya sayfaları", "Ürünler"];
    expect(headings.map((name) => screen.getByRole("group", { name }))).toEqual(groups);
    expect(groups.map((g) => g.firstElementChild?.textContent)).toEqual(headings);
    for (const name of [
      "Çanta, Kategori",
      "Çınar, Marka",
      "Yazlık, Koleksiyon",
      "Bahar, Kampanya sayfası",
      "Deri Çanta, Ürün",
    ])
      expect(screen.getByRole("option", { name })).toBeTruthy();
    const pictures = groups.map((g) => g.querySelector("img")?.getAttribute("src") ?? null);
    expect(pictures).toEqual(["/media/canta.jpg", null, null, null, null]);
    expect(document.querySelectorAll("[data-placeholder]")).toHaveLength(4);
    expect(screen.getByRole("listbox").textContent).not.toContain("₺");
  });

  it("moves through the rows with the arrow keys and opens the highlighted one with Enter", async () => {
    suggest([...DRESSES, { type: "brand", items: [item("Elit", "/ara?brand=7")] }]);
    const { router, box, user } = await open();
    await user.type(box, "el");
    await settle();
    const selected = () =>
      screen.queryAllByRole("option", { selected: true }).map((o) => o.textContent);
    const combobox = screen.getByRole("combobox", { name: "Ürün ara" });
    expect(combobox.getAttribute("aria-expanded")).toBe("true");
    expect(combobox.getAttribute("aria-controls")).toBe(screen.getByRole("listbox").id);
    expect(selected()).toEqual([]);
    expect(combobox.getAttribute("aria-activedescendant")).toBeNull();

    await user.keyboard("{ArrowDown}");
    expect(selected()).toEqual(["Elbise, Kategori"]);
    expect(combobox.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { selected: true }).id,
    );
    await user.keyboard("{ArrowUp}");
    expect(selected()).toEqual(["Tüm sonuçları gör"]);
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(selected()).toEqual(["Elit, Marka"]);

    await user.keyboard("{Enter}");
    await wait(10);
    expect(router.state.location.pathname).toBe("/ara");
    expect(router.state.location.search).toEqual({ brand: 7 });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("opens /ara for the typed text on Enter with nothing highlighted", async () => {
    suggest(DRESSES);
    const { router, box, user } = await open();
    await user.type(box, " elbise ");
    await settle();
    await user.keyboard("{Enter}");
    await wait(10);
    expect(router.state.location.pathname).toBe("/ara");
    expect(router.state.location.search).toEqual({ q: "elbise" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("opens a clicked row, and /ara from the last row", async () => {
    suggest(DRESSES);
    const { router, box, user } = await open();
    await user.type(box, "elb");
    await settle();
    await user.click(screen.getByRole("option", { name: /Elbise/ }));
    await wait(10);
    expect(router.state.location.pathname).toBe("/kategori/elbise");
    expect(screen.queryByRole("listbox")).toBeNull();

    await user.clear(box);
    await user.type(box, "elbi");
    await settle();
    await user.click(screen.getByRole("option", { name: "Tüm sonuçları gör" }));
    await wait(10);
    expect(router.state.location.pathname).toBe("/ara");
    expect(router.state.location.search).toEqual({ q: "elbi" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("closes on Escape, keeping the text, and reopens on an arrow key or more typing", async () => {
    suggest(DRESSES);
    const { box, user } = await open();
    await user.type(box, "elb");
    await settle();
    await user.keyboard("{ArrowDown}{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(box.value).toBe("elb");
    expect(box.getAttribute("aria-expanded")).toBe("false");

    await user.keyboard("{ArrowDown}");
    expect(options()).toHaveLength(2);
    expect(screen.queryAllByRole("option", { selected: true })).toEqual([]);

    await user.keyboard("{Escape}i");
    await settle();
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("closes on a click outside or on tabbing away, and reopens on focus", async () => {
    suggest(DRESSES);
    const { box, user } = await open();
    await user.type(box, "elb");
    await settle();
    await user.click(screen.getByRole("button", { name: "Sayfa" }));
    expect(screen.queryByRole("listbox")).toBeNull();

    await user.click(box);
    expect(screen.getByRole("listbox")).toBeTruthy();
    await user.click(screen.getByText("Metin")); // nothing there takes focus
    expect(screen.queryByRole("listbox")).toBeNull();

    await user.click(box);
    await user.tab(); // to "Ara", still part of the search box
    expect(screen.getByRole("listbox")).toBeTruthy();
    await user.tab();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("keeps the rows while the next answer loads, then highlights none of the new ones", async () => {
    suggest(DRESSES);
    const { box, user } = await open();
    await user.type(box, "el");
    await settle();

    let reply = () => {};
    serverFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          reply = () =>
            resolve(answer([{ type: "product", items: [item("Elbise Askısı", "/urun/aski")] }]));
        }),
    );
    await user.type(box, "b");
    await settle();
    expect(options()).toEqual(["Elbise, Kategori", "Tüm sonuçları gör"]);
    await user.keyboard("{ArrowDown}");

    reply();
    await wait(10);
    expect(options()).toEqual(["Elbise Askısı, Ürün", "Tüm sonuçları gör"]);
    expect(screen.queryAllByRole("option", { selected: true })).toEqual([]);
  });

  it("shows nothing for under 2 characters, even with an earlier answer in hand", async () => {
    suggest(DRESSES);
    const { box, user } = await open();
    await user.type(box, "el");
    await settle();
    await user.type(box, "{Backspace}");
    expect(screen.queryByRole("listbox")).toBeNull();
    await settle();
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(requested()).toEqual(["el"]);
  });

  it("says nothing was found only for an empty answer to the current text", async () => {
    suggest([]);
    const { box, user } = await open();
    await user.type(box, "xq");
    await wait(200);
    expect(screen.queryByText("Sonuç bulunamadı")).toBeNull();
    await wait(10);
    expect(screen.getByRole("status").textContent).toBe("Sonuç bulunamadı");
    expect(options()).toEqual(["Tüm sonuçları gör"]);

    await user.type(box, "z"); // not answered yet
    expect(screen.queryByText("Sonuç bulunamadı")).toBeNull();
    expect(screen.queryByRole("listbox")).toBeNull();
    await settle();
    expect(screen.getByText("Sonuç bulunamadı")).toBeTruthy();
  });

  it.each([
    [
      "answers 503",
      async () => Response.json({ code: "suggestions_unavailable" }, { status: 503 }),
    ],
    ["cannot be reached", () => Promise.reject(new TypeError("fetch failed"))],
  ])("shows nothing when the API %s, and submitting still works", async (_, fail) => {
    suggest(DRESSES);
    const { router, box, user } = await open();
    await user.type(box, "el");
    await settle();
    serverFetch.mockImplementation(fail);
    await user.type(box, "b");
    await settle();
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryByText("Sonuç bulunamadı")).toBeNull();

    await user.keyboard("{Enter}");
    await wait(10);
    expect(router.state.location.search).toEqual({ q: "elb" });
  });

  it("closes when the page changes by other means", async () => {
    suggest(DRESSES);
    const { router, box, user } = await open();
    await user.type(box, "elb");
    await settle();
    await act(() => router.navigate({ href: "/urun/baska" }));
    await wait(10);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("is filled from ?q= on /ara without opening, and follows it", async () => {
    suggest(DRESSES);
    const { router, box, user } = await open("/ara?q=deri%20%C3%A7anta");
    await settle();
    expect(box.value).toBe("deri çanta");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(requested()).toEqual([]);

    await user.click(box);
    await wait(10);
    expect(screen.getByRole("listbox")).toBeTruthy();

    await act(() => router.navigate({ href: "/ara?q=42" }));
    await wait(10);
    expect(box.value).toBe("42");
    await act(() => router.navigate({ href: "/ara?brand=7" }));
    await wait(10);
    expect(box.value).toBe("");
  });

  it("keeps what is being typed when only the listing's page number changes", async () => {
    suggest(DRESSES);
    const { router, box, user } = await open("/ara?q=deri");
    await user.clear(box);
    await user.type(box, "elb");
    await settle();
    await act(() => router.navigate({ href: "/ara?q=deri&page=2" }));
    await wait(10);
    expect(box.value).toBe("elb");
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("keeps focus in the box while a row is pressed", async () => {
    suggest(DRESSES);
    const { box, user } = await open();
    await user.type(box, "elb");
    await settle();
    await user.pointer({
      keys: "[MouseLeft>]",
      target: screen.getByRole("option", { name: /Elbise/ }),
    });
    expect(document.activeElement).toBe(box);
  });

  /** The API answers "el", fails "elb", then leaves everything unanswered. */
  const answerThenFail = () =>
    serverFetch.mockImplementation((req) => {
      const q = new URL(req.url).searchParams.get("q");
      if (q === "el") return Promise.resolve(answer(DRESSES));
      if (q === "elb") return Promise.resolve(new Response(null, { status: 503 }));
      return new Promise(() => {});
    });

  it("does not bring back older rows while loading after a failure", async () => {
    answerThenFail();
    const { box, user } = await open();
    await user.type(box, "el");
    await settle();
    await user.type(box, "b");
    await settle();
    await user.type(box, "i");
    await settle();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("drops cached rows when asking for them again fails, and asks again after that", async () => {
    suggest(DRESSES);
    const { box, user } = await open();
    await user.type(box, "el");
    await settle();
    await user.click(screen.getByText("Metin"));
    await wait(31_000);
    serverFetch.mockImplementation(async () => new Response(null, { status: 503 }));
    await user.click(box);
    await wait(10);
    expect(screen.queryByRole("listbox")).toBeNull();

    suggest(DRESSES);
    await user.click(screen.getByText("Metin"));
    await user.click(box);
    await wait(10);
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it.each([
    ["a click outside", async (user: User) => user.click(screen.getByText("Metin"))],
    [
      "a page change",
      async (_: User, router: Router) => act(() => router.navigate({ href: "/urun/baska" })),
    ],
  ])("forgets the highlighted row after %s", async (_, dismiss) => {
    suggest(DRESSES);
    const { router, box, user } = await open();
    await user.type(box, "elb");
    await settle();
    await user.keyboard("{ArrowDown}");
    await dismiss(user, router);
    await wait(10);
    act(() => box.blur());
    await user.click(box);
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.queryAllByRole("option", { selected: true })).toEqual([]);
  });

  it.each(["true", "null", "1.50", "1e3", '"ab"'])(
    'searches for exactly %s from "Tüm sonuçları gör", as Enter does',
    async (text) => {
      suggest(DRESSES);
      const { router, box, user } = await open();
      await user.type(box, text);
      await settle();
      await user.keyboard("{Enter}");
      await wait(10);
      const byEnter = router.state.location.href;
      expect(router.state.location.search).toEqual({ q: text });

      await act(() => router.navigate({ href: "/" }));
      await user.clear(box);
      await user.type(box, text);
      await settle();
      const row = screen.getByRole("option", { name: "Tüm sonuçları gör" });
      expect(row.getAttribute("href")).toBe(byEnter);
      await user.click(row);
      await wait(10);
      expect(router.state.location.search).toEqual({ q: text });
      expect(box.value).toBe(text);
    },
  );

  it("stays closed after Escape when the window is left and returned to", async () => {
    suggest(DRESSES);
    const { box, user } = await open();
    await user.type(box, "elb");
    await settle();
    await user.keyboard("{Escape}");
    // Switching tabs blurs and refocuses the input while it remains the active element.
    fireEvent.blur(box);
    fireEvent.focus(box);
    await wait(10);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("searches for the new text when typing continues after highlighting a row", async () => {
    suggest(DRESSES);
    const { router, box, user } = await open();
    await user.type(box, "elb");
    await settle();
    await user.keyboard("{ArrowDown}i{Enter}"); // before the answer for "elbi" arrives
    await wait(10);
    expect(router.state.location.href).toBe("/ara?q=elbi");
  });
});
