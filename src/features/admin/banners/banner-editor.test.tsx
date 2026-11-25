import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FieldsForm, ImagesSection, PendingChange } from "./banner-editor";
import type { BannerOut } from "./queries";

const banner = (over: Partial<BannerOut> = {}): BannerOut => ({
  id: 1,
  slot: "category_top",
  message: "",
  link: "/kampanyalar/yaz",
  position: 2,
  starts_at: null,
  ends_at: null,
  category: null,
  status: "draft",
  published_at: null,
  submitted_by: null,
  submitted_at: null,
  rejection_reason: "",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
  image: null,
  mobile_image: null,
  pending_change: null,
  ...over,
});

const wrap = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>,
  );

const staff = { owner: false, submitter: false };
const owner = { owner: true, submitter: false };
const save = vi.fn();
const draft = { status: "draft" as never, hasPendingChange: false };

describe("FieldsForm", () => {
  it("shows an image slot's fields without a message", () => {
    const out = wrap(<FieldsForm banner={banner()} who={staff} state={draft} save={save} />);
    expect(out).toContain('value="/kampanyalar/yaz"');
    expect(out).toContain('value="2"');
    expect(out).not.toContain("Mesaj");
    // The Category Slot also asks which Category page it sits on.
    expect(out).toContain("Tüm kategoriler");
    expect(out).toContain(">Kaydet<");
  });

  it("shows the message of an announcement", () => {
    const out = wrap(
      <FieldsForm
        banner={banner({ slot: "announcement", message: "Kargo bedava" })}
        who={staff}
        state={draft}
        save={save}
      />,
    );
    expect(out).toContain('value="Kargo bedava"');
  });

  it("offers the Category picker for the category slot", () => {
    const out = wrap(
      <FieldsForm
        banner={banner({ slot: "category_top" })}
        who={staff}
        state={draft}
        save={save}
      />,
    );
    expect(out).toContain("Tüm kategoriler");
  });

  it("sends Staff's edit of a live Banner to the Owner", () => {
    const out = wrap(
      <FieldsForm
        banner={banner({ status: "published" })}
        who={staff}
        state={{ status: "published" as never, hasPendingChange: false }}
        save={save}
      />,
    );
    expect(out).toContain("sahibin onayına gider");
    expect(out).toContain(">Onaya gönder<");
  });

  it("locks the form for Staff while the Banner waits", () => {
    const out = wrap(
      <FieldsForm
        banner={banner({ status: "pending_approval" })}
        who={staff}
        state={{ status: "pending_approval" as never, hasPendingChange: false }}
        save={save}
      />,
    );
    expect(out).toContain("<fieldset disabled");
    expect(out).not.toContain(">Kaydet<");
  });
});

describe("ImagesSection", () => {
  it("asks for alt text before a first upload and allows no mobile image yet", () => {
    const out = wrap(<ImagesSection banner={banner()} editable note={null} />);
    expect(out).toContain("Alternatif metin");
    expect(out).toContain("Görsel yükle");
    expect(out).toContain("Önce ana görseli yükleyin.");
  });

  it("locks the images for Staff on a live Banner", () => {
    const out = wrap(
      <ImagesSection
        banner={banner({ status: "published" })}
        editable={false}
        note="Yalnızca sahip"
      />,
    );
    expect(out).toContain("Yalnızca sahip");
    expect(out).toContain("<fieldset disabled");
  });

  it("is editable for the Owner", () => {
    void owner;
    const out = wrap(
      <ImagesSection banner={banner({ status: "published" })} editable note={null} />,
    );
    expect(out).not.toContain("<fieldset disabled");
  });
});

describe("PendingChange", () => {
  it("shows what the change alters, before and after", () => {
    const out = wrap(
      <PendingChange
        banner={banner({
          status: "published",
          pending_change: {
            payload: { link: "/yeni", position: 2 },
            submitted_by: { id: 5, name: "Ayşe" },
            updated_at: "2026-06-02T10:00:00Z",
          },
        })}
      />,
    );
    expect(out).toContain("Bekleyen değişiklik");
    expect(out).toContain("/kampanyalar/yaz");
    expect(out).toContain("/yeni");
    expect(out).not.toContain("Sıra");
  });
});
