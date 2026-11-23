import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CampaignLink, FieldsForm, PendingChange } from "./campaign-page-editor";
import type { PageOut } from "./queries";

const page = (over: Partial<PageOut> = {}): PageOut => ({
  id: 1,
  title: "Yaz indirimi",
  slug: "yaz-indirimi",
  description: "**Yaz** geldi",
  starts_at: null,
  ends_at: null,
  status: "draft",
  published_at: null,
  submitted_by: null,
  submitted_at: null,
  rejection_reason: "",
  campaign: null,
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
  image: null,
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

describe("FieldsForm", () => {
  it("shows a draft's fields and a Markdown preview, and saves to the page", () => {
    const out = wrap(
      <FieldsForm
        page={page()}
        who={staff}
        state={{ status: "draft" as never, hasPendingChange: false }}
        save={save}
      />,
    );
    expect(out).toContain('value="Yaz indirimi"');
    // The preview sits behind a toggle, not beside the text.
    expect(out).toContain("Önizleme");
    expect(out).not.toContain("<strong>Yaz</strong>");
    expect(out).toContain("/kampanyalar/yaz-indirimi");
    expect(out).toContain(">Kaydet<");
  });

  it("tells Staff that an edit of a live page goes to the Owner", () => {
    const out = wrap(
      <FieldsForm
        page={page({ status: "published" })}
        who={staff}
        state={{ status: "published" as never, hasPendingChange: false }}
        save={save}
      />,
    );
    expect(out).toContain("sahibin onayına gider");
    expect(out).toContain(">Onaya gönder<");
  });

  it("starts from the pending change, so Staff amend it", () => {
    const out = wrap(
      <FieldsForm
        page={page({
          status: "published",
          pending_change: {
            payload: { title: "Yeni başlık" },
            submitted_by: null,
            updated_at: "2026-06-02T00:00:00Z",
          },
        })}
        who={staff}
        state={{ status: "published" as never, hasPendingChange: true }}
        save={save}
      />,
    );
    expect(out).toContain('value="Yeni başlık"');
  });

  it("is read-only for Staff on a page waiting for approval", () => {
    const out = wrap(
      <FieldsForm
        page={page({ status: "pending_approval" })}
        who={staff}
        state={{ status: "pending_approval" as never, hasPendingChange: false }}
        save={save}
      />,
    );
    expect(out).toContain("<fieldset disabled");
    expect(out).not.toContain(">Kaydet<");
  });

  it("is read-only for the Owner while a change is pending", () => {
    const out = wrap(
      <FieldsForm
        page={page({ status: "published" })}
        who={owner}
        state={{ status: "published" as never, hasPendingChange: true }}
        save={save}
      />,
    );
    expect(out).toContain("onaylayın veya reddedin");
    expect(out).not.toContain(">Kaydet<");
  });
});

describe("CampaignLink", () => {
  const link = vi.fn();

  it("lets the Owner pick a discount Campaign", () => {
    const out = wrap(<CampaignLink page={page()} owner link={link} />);
    expect(out).toContain("Bağlı değil");
    expect(out).toMatch(/<button[^>]*disabled[^>]*>Bağlantıyı kaldır/);
  });

  it("gives Staff no control, only the current link", () => {
    const out = wrap(
      <CampaignLink
        page={page({ campaign: { id: 4, name: "Yaz %20", status: "active" } })}
        owner={false}
        link={link}
      />,
    );
    expect(out).toContain("Bağlı kampanya: Yaz %20.");
    expect(out).toContain("yalnızca sahip değiştirebilir");
    expect(out).not.toContain("<select");
    expect(out).not.toContain("<button");
  });
});

describe("PendingChange", () => {
  it("shows what changed, before and after", () => {
    const out = wrap(
      <PendingChange
        page={page({
          status: "published",
          pending_change: {
            payload: { title: "Yeni", slug: "yaz-indirimi" },
            submitted_by: { id: 2, name: "Ayşe" },
            updated_at: "2026-06-02T00:00:00Z",
          },
        })}
      />,
    );
    expect(out).toContain("Ayşe");
    expect(out).toContain("Yaz indirimi");
    expect(out).toContain("Yeni");
    expect(out).not.toContain("Adres");
  });
});
