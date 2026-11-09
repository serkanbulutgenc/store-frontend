import { expect, it } from "vitest";
import { nextStep, toApiError } from "./allauth";

it("detects the pending 2FA flow on a 401", () => {
  const body = {
    status: 401,
    data: { flows: [{ id: "login" }, { id: "mfa_authenticate", is_pending: true }] },
  };
  expect(nextStep(401, body)).toBe("mfa");
});

it("treats a 200 as signed in", () => {
  expect(nextStep(200, { status: 200 })).toBe("done");
});

it("maps allauth errors to the envelope", () => {
  const e = toApiError(400, {
    status: 400,
    errors: [{ message: "Hatalı kod.", code: "incorrect_code", param: "code" }],
  });
  expect(e).toMatchObject({
    status: 400,
    code: "incorrect_code",
    message: "Hatalı kod.",
    fields: { code: ["Hatalı kod."] },
  });
});

it("falls back to the default message", () => {
  expect(toApiError(500, "x").message).toBe("İstek işlenemedi.");
});
