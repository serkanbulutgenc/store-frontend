import { toast } from "sonner";
import { ApiError } from "./errors";

/**
 * Global policy for query and mutation failures. A 401 means the proxy already cleared the
 * session cookie, so re-running the route guards sends the user to the login page; a 403
 * is a toast. Everything else is rendered by the screen that asked.
 */
export function createErrorHandler(opts: { onUnauthorized: () => void }) {
  return (error: unknown) => {
    if (!(error instanceof ApiError)) return;
    if (error.status === 401) opts.onUnauthorized();
    else if (error.status === 403) toast.error(error.message);
  };
}
