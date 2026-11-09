import { createFileRoute } from "@tanstack/react-router";
import { getEnv } from "@/env";
import { forward } from "@/lib/api/proxy";

const handle = ({ request }: { request: Request }) => {
  const env = getEnv();
  return forward(request, {
    apiUrl: env.API_INTERNAL_URL,
    sessionCookie: env.SESSION_COOKIE_NAME,
    csrfCookie: env.CSRF_COOKIE_NAME,
  });
};

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});
