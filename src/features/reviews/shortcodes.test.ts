import { expect, it } from "vitest";
import { convertShortcodes } from "./shortcodes";

it("converts known shortcodes", () => expect(convertShortcodes("süper :smile:")).toBe("süper 😄"));
it("converts several", () => expect(convertShortcodes(":fire::100:")).toBe("🔥💯"));
it("leaves unknown names and times alone", () => {
  expect(convertShortcodes(":nope: saat 10:30:45")).toBe(":nope: saat 10:30:45");
});

it("ignores colons inside other text", () => {
  expect(convertShortcodes("oran 5:100:3")).toBe("oran 5:100:3");
});
