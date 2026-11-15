import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { VoucherField } from "./voucher-field";

const props = {
  voucher: null as {
    code: string;
    discount: string;
    minimum?: string | null;
    problem?: string | null;
  } | null,
  error: null as string | null,
  pending: false,
  onApply: vi.fn(),
  onRemove: vi.fn(),
  onContinueWithout: undefined as (() => void) | undefined,
};
const html = (over: Partial<typeof props> = {}) =>
  renderToString(<VoucherField {...props} {...over} />);

describe("VoucherField", () => {
  it("shows the applied code, what it takes off and a way to remove it", () => {
    const out = html({ voucher: { code: "YAZ10", discount: "20.00" } });
    expect(out).toContain("Kupon (YAZ10)");
    expect(out).toContain("−₺20,00");
    expect(out).toContain("Kaldır");
  });

  it("asks for a code when none is applied", () => {
    const out = html({ voucher: null });
    expect(out).toMatch(/<label[^>]*>Kupon kodu<\/label>/);
    expect(out).toContain("<input");
    expect(out).toContain("Uygula");
    expect(out).not.toContain("Kaldır");
    expect(out).not.toContain("Kupon (");
  });

  it("tells the Shopper why a code was refused, and marks the field invalid", () => {
    const out = html({ voucher: null, error: "Geçersiz kupon kodu." });
    expect(out).toMatch(/<p[^>]*role="alert"[^>]*>Geçersiz kupon kodu\.<\/p>/);
    expect(out).toContain('aria-invalid="true"');
  });

  it("shows no alert before anything was refused", () => {
    expect(html({ voucher: null })).not.toContain('role="alert"');
    expect(html({ voucher: null })).not.toContain('aria-invalid="true"');
  });

  it("explains a code that no longer applies instead of showing a saving", () => {
    const below = html({
      voucher: { code: "BIG10", discount: "0.00", minimum: "250.00", problem: "minimum" },
    });
    expect(below).toMatch(
      /<p[^>]*role="alert"[^>]*>Bu kupon için sepet tutarı en az ₺250,00 olmalı\.<\/p>/,
    );
    expect(below).not.toContain("−₺0,00");
    expect(below).toContain("Kupon (BIG10)");
    expect(below).toContain("Kaldır"); // the Shopper can still take it off

    const old = html({
      voucher: { code: "OLD10", discount: "0.00", minimum: null, problem: "expired" },
    });
    expect(old).toContain("Bu kuponun süresi dolmuş.");
    expect(old).not.toContain("−₺0,00");
  });

  it("cannot be pressed twice while a request is on its way", () => {
    expect(html({ voucher: null, pending: true })).toMatch(
      /<button[^>]*disabled=""[^>]*>Uygula<\/button>/,
    );
    expect(html({ voucher: null, pending: false })).not.toContain('disabled=""');

    const applied = { code: "YAZ10", discount: "20.00" };
    expect(html({ voucher: applied, pending: true })).toMatch(
      /<button[^>]*disabled=""[^>]*>[\s\S]*Kaldır<\/button>/,
    );
    expect(html({ voucher: applied, pending: false })).not.toContain('disabled=""');
  });

  it("offers to carry on without the code only when checkout refused it", () => {
    const voucher = { code: "OLD10", discount: "0.00", problem: "expired" };
    const out = html({ voucher, onContinueWithout: vi.fn() });
    expect(out).toMatch(/<button[^>]*>Kuponsuz devam et<\/button>/);
    expect(out).toContain("Kupon (OLD10)");
    expect(html({ voucher })).not.toContain("Kuponsuz devam et");
    expect(html({ voucher: null, onContinueWithout: vi.fn() })).not.toContain("Kuponsuz devam et");
  });

  it("shows a refusal from checkout next to the code that was refused", () => {
    // The cart cannot know a Guest already used the code; only placing the Order finds out.
    const out = html({
      voucher: { code: "ONCE10", discount: "20.00" },
      error: "Geçersiz kupon kodu.",
      onContinueWithout: vi.fn(),
    });
    expect(out).toMatch(/<p[^>]*role="alert"[^>]*>Geçersiz kupon kodu\.<\/p>/);
    expect(out).toContain("Kupon (ONCE10)");
    expect(out).toContain("Kuponsuz devam et");
    expect(out).not.toContain("−₺20,00"); // not offered as a saving while it is refused
  });
});
