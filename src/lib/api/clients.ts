import { createIsomorphicFn } from "@tanstack/react-start";
import createClient, { type Middleware } from "openapi-fetch";
import type { paths as AdminPaths } from "../../../api/specs/openapi-admin";
import type { paths as StorePaths } from "../../../api/specs/openapi-store";
import { ApiError } from "./errors";

/** Browser: plain fetch to the Start server. Server: in-process proxy helper. */
const apiFetch = createIsomorphicFn()
  .client((req: Request) => fetch(req))
  .server(async (req: Request) => (await import("./server-fetch")).serverFetch(req));

/** Maps every non-2xx response, envelope or not, to a typed `ApiError`. */
const errors: Middleware = {
  async onResponse({ response }) {
    if (response.ok) return undefined;
    const body = await response
      .clone()
      .json()
      .catch(() => null);
    throw ApiError.from(response.status, body);
  },
};

// Relative paths resolve against the page origin in the browser; the server fetch
// re-bases them on the incoming request, so the placeholder origin is never contacted.
const baseUrl = globalThis.location?.origin ?? "http://localhost";

function make<P extends object>() {
  const client = createClient<P>({ baseUrl, fetch: apiFetch });
  client.use(errors);
  return client;
}

export const storeApi = make<StorePaths>();
export const adminApi = make<AdminPaths>();
