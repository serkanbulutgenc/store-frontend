import { expect, it } from "vitest";
import { ApiError } from "./errors";

it("maps the envelope", () => {
  const e = ApiError.from(422, {
    code: "validation_error",
    message: "Geçersiz",
    fields: { qty: ["Çok"] },
  });
  expect(e).toMatchObject({ status: 422, code: "validation_error", fields: { qty: ["Çok"] } });
});

it("tolerates a non-envelope body", () => {
  expect(ApiError.from(502, "<html>")).toMatchObject({ status: 502, code: "error", fields: {} });
});
