import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { Me } from "@/lib/api/me";
import { attemptDelete, DeleteAction, DeleteConfirmBody, twoStepDelete } from "./delete-confirm";

const props = {
  name: "Elbise",
  touches: ["3 ürün", "2 alt kategori"],
  error: null as string | null,
  pending: false,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  alternative: undefined as { label: string; run: () => void } | undefined,
  menuItemCount: undefined as number | undefined,
};
/** Renders inside a bare router, which the Dashboard `Link`s in the body need. */
async function html(over: Partial<typeof props> = {}) {
  const root = createRootRoute({ component: () => <DeleteConfirmBody {...props} {...over} /> });
  const router = createRouter({
    routeTree: root,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  return renderToString(<RouterProvider router={router} />);
}

describe("delete confirmation", () => {
  it("names the item and shows what the delete touches", async () => {
    const out = await html();
    expect(out).toContain("<strong>Elbise</strong>");
    expect(out).toContain("3 ürün");
    expect(out).toContain("2 alt kategori");
  });

  it("tells the Owner what blocks a refused delete", async () => {
    const out = await html({ error: "Silinemez: 4 siparişte kullanılıyor." });
    expect(out).toMatch(/<p[^>]*role="alert"[^>]*>Silinemez: 4 siparişte kullanılıyor\.<\/p>/);
  });

  it("offers the alternative only once the delete was refused", async () => {
    const alternative = { label: "Pasifleştir", run: vi.fn() };
    expect(await html({ alternative })).not.toContain("Pasifleştir");
    expect(await html({ alternative, error: "Silinemez: 2 varyant." })).toContain("Pasifleştir");
  });

  it("shows no alert before anything was refused", async () => {
    expect(await html()).not.toContain('role="alert"');
  });
});

describe("a delete blocked by Menu items (ADR 0007)", () => {
  const blocked = (menuItemCount: number | undefined) => html({ touches: [], menuItemCount });

  it("names the count and sends the Owner to the Menu builder to remove them first", async () => {
    const out = await blocked(2);
    expect(out).toContain("2 menü öğesi");
    expect(out).toContain("menüden kaldırın");
    expect(out).toMatch(/<a[^>]*href="\/admin\/menus"/);
  });

  it("says nothing about Menus when no Menu item points at the target", async () => {
    for (const count of [0, undefined]) {
      const out = await blocked(count);
      expect(out).not.toContain("menü öğesi");
      expect(out).not.toContain("/admin/menus");
    }
  });
});

describe("attempting a delete", () => {
  it("reports no error and returns true when the delete goes through", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    expect(await attemptDelete(run)).toEqual({ ok: true });
    expect(run).toHaveBeenCalledOnce();
  });

  it("returns the backend's refusal so the dialog can show it", async () => {
    const run = vi
      .fn()
      .mockRejectedValue(new ApiError(409, "conflict", "Silinemez: 4 siparişte kullanılıyor."));
    expect(await attemptDelete(run)).toEqual({
      ok: false,
      error: "Silinemez: 4 siparişte kullanılıyor.",
    });
  });
});

describe("who gets a delete action", () => {
  const me = (permissions: string[], role: Me["role"]): Me => ({
    id: 1,
    email: "a@b.c",
    name: "A",
    role,
    permissions,
    mfa_required: false,
    mfa_enrolled: true,
  });
  const action = (who: Me) =>
    renderToString(
      <DeleteAction me={who} name="Elbise" title="Ürünü sil" run={async () => undefined} />,
    );

  it("gives the Owner a delete button named after the item", () => {
    expect(action(me(["delete_catalogue"], "owner"))).toContain('aria-label="Elbise sil"');
  });

  it("gives Staff nothing", () => {
    expect(action(me(["manage_products"], "staff"))).toBe("");
  });
});

describe("a delete the backend wants confirmed twice", () => {
  const needs = () => new ApiError(409, "confirmation_required", "3 üründen değer silinir.");

  it("surfaces the impact first and goes through on the second confirmation", async () => {
    const calls: boolean[] = [];
    const run = vi.fn(async (confirm: boolean) => {
      calls.push(confirm);
      if (!confirm) throw needs();
    });
    const step = twoStepDelete(run);
    expect(await attemptDelete(step)).toEqual({ ok: false, error: "3 üründen değer silinir." });
    expect(await attemptDelete(step)).toEqual({ ok: true });
    expect(calls).toEqual([false, true]);
  });

  it("deletes at once when nothing needs confirming", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    expect(await attemptDelete(twoStepDelete(run))).toEqual({ ok: true });
    expect(run).toHaveBeenCalledExactlyOnceWith(false);
  });
});
