import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ReferenceScreen } from "./reference-screen";

const html = (canDelete: boolean) =>
  renderToString(
    <ReferenceScreen
      title="Markalar"
      singular="marka"
      rows={[{ id: 1, name: "Nike" }]}
      canManage
      canDelete={canDelete}
      columns={[{ header: "Ad", cell: (r) => r.name }]}
      fields={[{ name: "name", label: "Ad" }]}
      schema={z.object({ name: z.string() }) as never}
      defaults={() => ({ name: "" })}
      save={async () => undefined}
      remove={{ run: async () => undefined }}
    />,
  );

describe("who can delete a reference row", () => {
  it("gives the Owner a delete button next to edit", () => {
    const out = html(true);
    expect(out).toContain("Düzenle");
    expect(out).toContain("Sil");
  });

  it("gives Staff edit but no delete", () => {
    const out = html(false);
    expect(out).toContain("Düzenle");
    expect(out).not.toContain(">Sil<");
  });
});
