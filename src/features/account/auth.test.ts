import { describe, expect, it } from "vitest";
import { outcome } from "./auth";

const flows = (...f: object[]) => ({ status: 401, data: { flows: f } });

describe("outcome", () => {
  it("200 is signed in", () => expect(outcome(200, {})).toBe("signed_in"));
  it("a pending email verification is its own outcome", () =>
    expect(outcome(401, flows({ id: "verify_email", is_pending: true }))).toBe("verify_email"));
  it("a flow that is not pending does not count", () =>
    expect(outcome(401, flows({ id: "verify_email" }))).toBeNull());
  it("a pending 2FA step is not a way into the storefront", () =>
    expect(outcome(401, flows({ id: "mfa_authenticate", is_pending: true }))).toBeNull());
  it("wrong credentials", () => expect(outcome(400, { errors: [] })).toBeNull());
  it("an empty body", () => expect(outcome(401, null)).toBeNull());
});
