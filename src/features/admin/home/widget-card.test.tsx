import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { Mail } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { WidgetCard } from "./widget-card";
import { SortableWidget } from "./widget-chrome";

const noop = () => {};

function page(collapsed: boolean, count = 2) {
  return renderToStaticMarkup(
    <DndContext>
      <SortableContext items={["k"]}>
        <SortableWidget
          id="k"
          chrome={{ label: "Yanıtlar", icon: Mail, collapsed, onToggle: noop, onDismiss: noop }}
        >
          <WidgetCard
            id="w"
            title="Yanıtlar"
            count={count}
            empty="Yok."
            seeAll={<a href="/x">Tümü</a>}
          >
            <p>iki satır</p>
          </WidgetCard>
        </SortableWidget>
      </SortableContext>
    </DndContext>,
  );
}

it("shows the title with its count, the body and a way to the full list", () => {
  const html = page(false);
  expect(html).toContain("Yanıtlar (2)");
  expect(html).toContain("iki satır");
  expect(html).toContain("Tümü");
});

it("has a drag handle, a fold button and a dismiss button named after the card", () => {
  const html = page(false);
  expect(html).toContain('aria-label="Yanıtlar: sürükle"');
  expect(html).toContain('aria-label="Yanıtlar: daralt"');
  expect(html).toContain('aria-expanded="true"');
  expect(html).toContain('aria-label="Yanıtlar: kaldır"');
  expect(html).toContain("<svg"); // the header icon
});

it("keeps only the header when folded, and offers to open it", () => {
  const html = page(true);
  expect(html).toContain("Yanıtlar (2)");
  expect(html).toContain('aria-label="Yanıtlar: aç"');
  expect(html).toContain('aria-expanded="false"');
  // The body stays in the page but hidden, so a dialog it owns is not torn down.
  expect(html).toMatch(/<div id="[^"]+" hidden=""/);
});

it("says nothing is waiting instead of an empty list", () => {
  const html = page(false, 0);
  expect(html).toContain("Yok.");
  expect(html).not.toContain("Tümü");
});

it("is a plain card outside the page: no buttons", () => {
  const html = renderToStaticMarkup(
    <WidgetCard id="w" title="Özet">
      <p>gövde</p>
    </WidgetCard>,
  );
  expect(html).toContain("Özet");
  expect(html).not.toContain("<button");
});
