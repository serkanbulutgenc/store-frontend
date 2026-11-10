import { expect, it } from "vitest";
import { otpauthUrl, parseTotpStatus } from "./totp";

it("reads the secret from the 404 an unenrolled account gets", () => {
  expect(parseTotpStatus(404, { meta: { secret: "ABC" } })).toEqual({
    active: false,
    secret: "ABC",
  });
});
it("reports an existing authenticator on 200", () => {
  expect(parseTotpStatus(200, { data: {} })).toEqual({ active: true });
});
it("throws on anything else", () => {
  expect(() => parseTotpStatus(500, null)).toThrow();
});
it("builds an otpauth URI", () => {
  expect(otpauthUrl("ABC", "a@b.com", "Shop")).toBe(
    "otpauth://totp/Shop%3Aa%40b.com?secret=ABC&issuer=Shop",
  );
});
