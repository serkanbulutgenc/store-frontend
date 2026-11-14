import { DndContext } from "@dnd-kit/core";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DragHandle } from "./category-drag";

describe("the drag handle", () => {
  const html = renderToString(
    <DndContext>
      <DragHandle id={3} name="Elbise" />
    </DndContext>,
  );

  it("is a button a keyboard user can reach and name", () => {
    const tag = /<button[^>]*>/.exec(html)?.[0] ?? "";
    expect(tag).toContain('aria-label="Elbise sürükle"');
    expect(tag).toContain('tabindex="0"');
    expect(tag).toContain('type="button"');
  });

  it("is not disabled", () => {
    expect(html).not.toContain('disabled=""');
  });
});
