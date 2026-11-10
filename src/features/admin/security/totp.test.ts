import { afterEach, expect, it, vi } from "vitest";
import { activateWithReauth, otpauthUrl, parseTotpStatus } from "./totp";

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

const reauthBody = { status: 401, data: { flows: [{ id: "reauthenticate" }] } };
const res = (status: number, body: unknown) => Response.json(body, { status });
afterEach(() => vi.unstubAllGlobals());

it("confirms the password and retries once when a recent login is required", async () => {
  const f = vi
    .fn()
    .mockResolvedValueOnce(res(401, reauthBody))
    .mockResolvedValueOnce(res(200, { status: 200 }))
    .mockResolvedValueOnce(res(200, { status: 200 }));
  vi.stubGlobal("fetch", f);
  await activateWithReauth("123456", "pw");
  expect(f.mock.calls.map((c) => c[0])).toEqual([
    "/api/auth/account/authenticators/totp",
    "/api/auth/auth/reauthenticate",
    "/api/auth/account/authenticators/totp",
  ]);
});

it("asks for the password instead of failing generically when none was entered", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res(401, reauthBody)));
  await expect(activateWithReauth("123456", "")).rejects.toMatchObject({
    fields: { password: ["Parolanızı girin."] },
  });
});

it("reports a wrong password on the password field", async () => {
  const wrong = { status: 400, errors: [{ message: "Parola hatalı.", code: "password_mismatch" }] };
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValueOnce(res(401, reauthBody)).mockResolvedValueOnce(res(400, wrong)),
  );
  await expect(activateWithReauth("123456", "bad")).rejects.toMatchObject({
    fields: { password: ["Parola hatalı."] },
  });
});
