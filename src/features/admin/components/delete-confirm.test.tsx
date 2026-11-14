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
};
const html = (over: Partial<typeof props> = {}) =>
  renderToString(<DeleteConfirmBody {...props} {...over} />);

describe("delete confirmation", () => {
  it("names the item and shows what the delete touches", () => {
    const out = html();
    expect(out).toContain("<strong>Elbise</strong>");
    expect(out).toContain("3 ürün");
    expect(out).toContain("2 alt kategori");
  });

  it("tells the Owner what blocks a refused delete", () => {
    const out = html({ error: "Silinemez: 4 siparişte kullanılıyor." });
    expect(out).toMatch(/<p[^>]*role="alert"[^>]*>Silinemez: 4 siparişte kullanılıyor\.<\/p>/);
  });

  it("offers the alternative only once the delete was refused", () => {
    const alternative = { label: "Pasifleştir", run: vi.fn() };
    expect(html({ alternative })).not.toContain("Pasifleştir");
    expect(html({ alternative, error: "Silinemez: 2 varyant." })).toContain("Pasifleştir");
  });

  it("shows no alert before anything was refused", () => {
    expect(html()).not.toContain('role="alert"');
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
