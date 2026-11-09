import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { Me } from "./me";
import { loadMe, ME_KEY } from "./me-query";

const me = {
  id: 1,
  email: "a@b.c",
  name: "A",
  role: "staff",
  permissions: [],
  mfa_required: false,
  mfa_enrolled: false,
} satisfies Me;

describe("loadMe", () => {
  it("fetches once across repeated navigations and preloads", async () => {
    const qc = new QueryClient();
    const fetcher = vi.fn(async () => me);
    await loadMe(qc, fetcher);
    await loadMe(qc, fetcher);
    await loadMe(qc, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("caches the signed-out answer too", async () => {
    const qc = new QueryClient();
    const fetcher = vi.fn(async () => null);
    expect(await loadMe(qc, fetcher)).toBeNull();
    await loadMe(qc, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("fetches again after the entry is removed (login) or the cache is cleared (logout, 401)", async () => {
    const qc = new QueryClient();
    const fetcher = vi.fn(async () => me);
    await loadMe(qc, fetcher);
    qc.removeQueries({ queryKey: ME_KEY });
    await loadMe(qc, fetcher);
    qc.clear();
    await loadMe(qc, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
