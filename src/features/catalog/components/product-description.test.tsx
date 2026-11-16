import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProductDescription } from "./product-description";

const html = (source: string) => renderToStaticMarkup(<ProductDescription source={source} />);

describe("ProductDescription", () => {
  it("renders bold, italic and lists as real elements", () => {
    const out = html("**Pamuklu** ve *yumuşak*\n\n- yıkanabilir\n- ütü gerekmez\n\n1. bir\n2. iki");

    expect(out).toContain("<strong>Pamuklu</strong>");
    expect(out).toContain("<em>yumuşak</em>");
    expect(out).toContain("<ul>");
    expect(out).toContain("<li>yıkanabilir</li>");
    expect(out).toContain("<ol>");
  });

  it("ignores raw HTML instead of rendering or showing it", () => {
    const out = html(
      'Merhaba <b onclick="x()">kalın</b>\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>',
    );

    expect(out).not.toMatch(/<b[ >]|<script|<img|onerror|onclick/);
    expect(out).not.toContain("&lt;");
    expect(out).toContain("Merhaba");
  });

  it("demotes # and ## to h3 and keeps h3 to h6", () => {
    const out = html("# Bir\n\n## İki\n\n### Üç\n\n#### Dört\n\n##### Beş\n\n###### Altı");

    expect(out).not.toMatch(/<h[12][ >]/);
    expect(out).toMatch(/<h3[^>]*>Bir<\/h3>/);
    expect(out).toMatch(/<h3[^>]*>İki<\/h3>/);
    expect(out).toMatch(/<h3[^>]*>Üç<\/h3>/);
    expect(out).toMatch(/<h4[^>]*>Dört<\/h4>/);
    expect(out).toMatch(/<h5[^>]*>Beş<\/h5>/);
    expect(out).toMatch(/<h6[^>]*>Altı<\/h6>/);
  });

  it("keeps http, https, mailto and site-relative links, and marks outside ones nofollow", () => {
    const out = html(
      "[güvenli](https://ornek.com/a) [posta](mailto:a@b.co) [kötü](javascript:alert(1)) " +
        "[veri](data:text/html;base64,AAAA) [harici](//evil.com) [ters](/\\evil2.com) " +
        "[göreli](/urun/pamuklu-tisort?renk=3#yorumlar)",
    );

    expect(out).toMatch(/<a [^>]*href="https:\/\/ornek.com\/a"[^>]*rel="nofollow noopener"/);
    expect(out).toContain('href="mailto:a@b.co"');
    for (const bad of ["javascript:", "data:", "evil.com"]) {
      expect(out).not.toContain(bad);
    }
    expect(out).toContain("kötü"); // the text stays, only the link goes
    expect(out).toContain("harici");
    // `/\host` is read as `//host` by browsers; the parser encodes the backslash, so it
    // stays a path on this site and no href can start with `//` or `/\`.
    expect(out).not.toMatch(/href="(\/\/|\/\\)/);
  });

  it("links to our own pages without nofollow", () => {
    const out = html("[göreli](/urun/pamuklu-tisort?renk=3#yorumlar)");

    expect(out).toContain('href="/urun/pamuklu-tisort?renk=3#yorumlar"');
    expect(out).not.toContain("nofollow");
  });

  it("shows only our own images, lazy and responsive, and drops all others", () => {
    const out = html(
      "![Ön yüz](/media/description/a1.jpg)\n\n" +
        "![dış görsel](https://evil.example/x.png)\n\n" +
        "![aynı protokol](//evil.example/media/x.png)\n\n" +
        "![veri](data:image/png;base64,AAAA)",
    );

    expect(out).toMatch(/<img [^>]*src="\/media\/description\/a1.jpg"/);
    expect(out).toContain('alt="Ön yüz"');
    expect(out).toContain('loading="lazy"');
    expect(out).toMatch(/class="[^"]*max-w-full/);
    expect(out.match(/<img /g)).toHaveLength(1);
    expect(out).not.toMatch(/evil|dış görsel|aynı protokol|data:/);
  });

  it("renders tables inside a horizontally scrollable wrapper", () => {
    const out = html("| Beden | Göğüs |\n| --- | --- |\n| S | 90 |\n| M | 96 |");

    expect(out).toMatch(/<div class="[^"]*overflow-x-auto[^"]*"><table/);
    expect(out).toContain("<th>Beden</th>");
    expect(out).toContain("<td>96</td>");
  });

  it("keeps the text but drops strikethrough, task lists, code and quotes", () => {
    const out = html("~~eski~~ `kod`\n\n- [ ] yapılacak\n\n> alıntı\n\n```\nblok\n```");

    expect(out).not.toMatch(/<(del|input|code|pre|blockquote)[ >]/);
    for (const text of ["eski", "kod", "yapılacak", "alıntı", "blok"]) {
      expect(out).toContain(text);
    }
  });

  it("turns a single newline into a line break, like the old plain-text view", () => {
    expect(html("ilk satır\nikinci satır")).toMatch(/ilk satır<br\/>\s*ikinci satır/);
  });
});
