import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ReplyOut } from "./queries";
import { MessageList } from "./thread-parts";

const msg = (over: Partial<ReplyOut> = {}): ReplyOut => ({
  id: 1,
  kind: "shopper",
  body: "Siparişim ne zaman gelir?",
  state: "",
  author: null,
  decided_by: null,
  rejection_note: "",
  drafted_body: "",
  sent_at: null,
  created_at: "2026-11-23T09:00:00Z",
  ...over,
});

describe("MessageList", () => {
  it("shows the Shopper's message and a reply with its state and author", () => {
    const out = renderToString(
      <MessageList
        messages={[
          msg(),
          msg({
            id: 2,
            kind: "reply",
            state: "pending",
            body: "Yarın.",
            author: { id: 2, name: "Ayşe" },
          }),
        ]}
      />,
    );
    expect(out).toContain("Siparişim ne zaman gelir?");
    expect(out).toContain("Müşteri");
    expect(out).toContain("Ayşe");
    expect(out).toContain("Onay bekliyor");
  });

  it("keeps the Staff draft beside what the Owner sent", () => {
    const out = renderToString(
      <MessageList
        messages={[msg({ id: 2, kind: "reply", state: "sent", body: "Son", drafted_body: "İlk" })]}
      />,
    );
    expect(out).toContain("Son");
    expect(out).toContain("İlk");
    expect(out).toContain("Personelin taslağı");
  });

  it("shows why a reply was rejected", () => {
    const out = renderToString(
      <MessageList
        messages={[
          msg({
            id: 2,
            kind: "reply",
            state: "rejected",
            rejection_note: "Daha kibar olsun",
            decided_by: { id: 1, name: "Sahip" },
          }),
        ]}
      />,
    );
    expect(out).toContain("Daha kibar olsun");
    expect(out).toContain("Sahip");
  });

  it("renders each message's actions under it", () => {
    const out = renderToString(
      <MessageList messages={[msg()]} actionsFor={() => <button type="button">Düzenle</button>} />,
    );
    expect(out).toContain("Düzenle");
  });
});
