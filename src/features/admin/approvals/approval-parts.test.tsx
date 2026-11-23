import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DiffTable, QueueTable } from "./approval-parts";

const item = (over: object = {}) => ({
  type: "collection",
  label: "Koleksiyon",
  id: 1,
  title: "Yaz koleksiyonu",
  is_change: false,
  submitted_by: { id: 7, name: "Ayşe" },
  submitted_at: "2026-11-23T09:00:00Z",
  ...over,
});

describe("QueueTable", () => {
  it("says so when nothing waits", () => {
    expect(renderToString(<QueueTable items={[]} onReview={() => {}} />)).toContain(
      "Onay bekleyen bir şey yok.",
    );
  });

  it("lists each item with its kind, who sent it, and a review button named after it", () => {
    const out = renderToString(
      <QueueTable
        items={[item(), item({ id: 2, title: "Kış", is_change: true, submitted_by: null })]}
        onReview={() => {}}
      />,
    );
    expect(out).toContain("Yaz koleksiyonu");
    expect(out).toContain("Ayşe");
    expect(out).toContain("Yeni");
    expect(out).toContain("Değişiklik");
    expect(out).toContain('aria-label="Yaz koleksiyonu incele"');
    expect(out).toContain('aria-label="Kış incele"');
  });
});

describe("DiffTable", () => {
  const fields = [
    { field: "title", live: "Yaz", pending: "Yaz", changed: false },
    { field: "body", live: "ilk", pending: "değişti", changed: true },
  ];

  it("shows live and pending side by side and marks only what changed", () => {
    const out = renderToString(<DiffTable fields={fields} isChange />);
    expect(out).toContain("Yayındaki");
    expect(out).toContain("ilk");
    expect(out).toContain("değişti");
    expect(out.match(/Değişti</g)).toHaveLength(1);
    expect(out).toContain('data-changed="true"');
    expect(out).toContain('data-changed="false"');
  });

  it("leaves the live column empty for a first draft", () => {
    const out = renderToString(
      <DiffTable
        fields={[{ field: "title", live: null, pending: "Yeni sayfa", changed: true }]}
        isChange={false}
      />,
    );
    expect(out).toContain("Şu an");
    expect(out).toContain("Yeni sayfa");
    expect(out).not.toContain("Yayındaki");
  });
});
