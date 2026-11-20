import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readViewed, recordViewed } from "@/features/catalog/recently-viewed";

const logout = vi.hoisted(() => vi.fn());
vi.mock("@/features/admin/auth/allauth", () => ({ logout }));

import { endSession } from "./sign-out";

beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  });
  logout.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

describe("endSession", () => {
  it("clears the Recently viewed list and the query cache once signed out", async () => {
    logout.mockResolvedValue(undefined);
    recordViewed("a");
    const queryClient = new QueryClient();
    queryClient.setQueryData(["x"], 1);

    await endSession(queryClient);

    expect(readViewed()).toEqual([]);
    expect(queryClient.getQueryData(["x"])).toBeUndefined();
  });

  it("keeps the list when signing out failed, since the Shopper is still signed in", async () => {
    logout.mockRejectedValue(new Error("network"));
    recordViewed("a");

    await expect(endSession(new QueryClient())).rejects.toThrow("network");

    expect(readViewed()).toEqual(["a"]);
  });
});
