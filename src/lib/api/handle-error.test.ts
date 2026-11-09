import { beforeEach, describe, expect, it, vi } from "vitest";

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a) } }));

import { ApiError } from "./errors";
import { createErrorHandler } from "./handle-error";

describe("createErrorHandler", () => {
  const onUnauthorized = vi.fn();
  const handle = createErrorHandler({ onUnauthorized });
  beforeEach(() => vi.clearAllMocks());

  it("shows the Turkish message in a toast on 403", () => {
    handle(new ApiError(403, "forbidden", "Bu işlem için yetkiniz yok."));
    expect(toastError).toHaveBeenCalledWith("Bu işlem için yetkiniz yok.");
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("re-runs the route guards on 401", () => {
    handle(new ApiError(401, "unauthorized", "x"));
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("ignores other errors (screens render them)", () => {
    handle(new ApiError(422, "validation_error", "x"));
    handle(new Error("boom"));
    expect(toastError).not.toHaveBeenCalled();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
