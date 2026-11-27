import { describe, expect, it } from "vitest";
import { descriptionExcerpt } from "./description-excerpt";

describe("descriptionExcerpt", () => {
  it("returns plain text with no Markdown syntax", () => {
    const md =
      "# Başlık\n\n**Pamuklu** ve *yumuşak* [kumaş](https://x.com)\n\n- yıkanabilir\n- ütü gerekmez";

    expect(descriptionExcerpt(md)).toBe("Başlık Pamuklu ve yumuşak kumaş yıkanabilir ütü gerekmez");
  });

  it("drops images, joins table cells with spaces and ignores raw HTML", () => {
    const md =
      "Önce ![Ön yüz](/media/description/a.jpg) sonra\n\n| Beden | Göğüs |\n| --- | --- |\n| S | 90 |\n\n<script>alert(1)</script>";

    expect(descriptionExcerpt(md)).toBe("Önce sonra Beden Göğüs S 90");
  });

  it("keeps the text of code and quotes, and reads only tables as GFM", () => {
    expect(descriptionExcerpt("`kod`\n\n> alıntı")).toBe("kod alıntı");
    expect(descriptionExcerpt("~~eski~~ - [ ] yapılacak")).toBe("~~eski~~ - [ ] yapılacak");
  });

  it("does not split a formatted word from the punctuation after it", () => {
    expect(descriptionExcerpt("**Pamuklu**, *yumuşak*. [Kumaş](https://x.com)!")).toBe(
      "Pamuklu, yumuşak. Kumaş!",
    );
  });
});
