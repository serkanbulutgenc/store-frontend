import { describe, expect, it, vi } from "vitest";
import { forward, type ProxyConfig } from "./proxy";

const config: ProxyConfig = {
  apiUrl: "http://api:8000",
  sessionCookie: "store_session",
  csrfCookie: "csrftoken",
};

function upstream(res: Response) {
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => res);
  return fetchMock;
}

function headersOf(fetchMock: ReturnType<typeof upstream>): Headers {
  return new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
}

describe("forward", () => {
  it("maps the session cookie to X-Session-Token and keeps the basket cookie", async () => {
    const f = upstream(Response.json({ ok: true }));
    await forward(
      new Request("http://web/api/store/basket", {
        headers: { cookie: "store_session=tok; oscar_open_basket=7_abc" },
      }),
      config,
      f,
    );
    expect(f.mock.calls[0]?.[0]).toBe("http://api:8000/api/store/basket");
    const h = headersOf(f);
    expect(h.get("x-session-token")).toBe("tok");
    expect(h.get("cookie")).toBe("oscar_open_basket=7_abc");
  });

  it("sends the CSRF cookie value as X-CSRFToken on unsafe methods only", async () => {
    const f = upstream(Response.json({}));
    await forward(
      new Request("http://web/api/store/basket/lines", {
        method: "POST",
        body: "{}",
        headers: { cookie: "csrftoken=abc", "content-type": "application/json" },
      }),
      config,
      f,
    );
    expect(headersOf(f).get("x-csrftoken")).toBe("abc");

    const g = upstream(Response.json({}));
    await forward(
      new Request("http://web/api/store/csrf", { headers: { cookie: "csrftoken=abc" } }),
      config,
      g,
    );
    expect(headersOf(g).get("x-csrftoken")).toBeNull();
  });

  it("routes /api/auth/* to allauth headless", async () => {
    const f = upstream(Response.json({}));
    await forward(
      new Request("http://web/api/auth/auth/login", { method: "POST", body: "{}" }),
      config,
      f,
    );
    expect(f.mock.calls[0]?.[0]).toBe("http://api:8000/_allauth/app/v1/auth/login");
  });

  it("stores the allauth session token in an HttpOnly cookie and strips it from the body", async () => {
    const f = upstream(
      Response.json({ status: 200, meta: { session_token: "tok", is_authenticated: true } }),
    );
    const res = await forward(
      new Request("https://web/api/auth/auth/login", { method: "POST", body: "{}" }),
      config,
      f,
    );
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith("store_session="));
    expect(cookie).toMatch(/store_session=tok/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(JSON.stringify(await res.json())).not.toContain("tok");
  });

  it("keeps a pending-flow session token even on a 401 (2FA step)", async () => {
    const f = upstream(
      Response.json({ status: 401, meta: { session_token: "pending" } }, { status: 401 }),
    );
    const res = await forward(
      new Request("http://web/api/auth/auth/login", { method: "POST", body: "{}" }),
      config,
      f,
    );
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie().join(";")).toMatch(/store_session=pending/);
  });

  it("clears the session cookie on a 401", async () => {
    const f = upstream(
      Response.json({ code: "unauthorized", message: "x", fields: {} }, { status: 401 }),
    );
    const res = await forward(
      new Request("http://web/api/admin/me", { headers: { cookie: "store_session=old" } }),
      config,
      f,
    );
    expect(res.headers.getSetCookie().join(";")).toMatch(/store_session=;.*Max-Age=0/);
  });

  it("keeps the session cookie on a reauthentication 401 for a user who is still signed in", async () => {
    const f = upstream(
      Response.json(
        {
          status: 401,
          data: { flows: [{ id: "reauthenticate" }] },
          meta: { is_authenticated: true },
        },
        { status: 401 },
      ),
    );
    const res = await forward(
      new Request("http://web/api/auth/account/authenticators/totp", {
        method: "POST",
        headers: { cookie: "store_session=live" },
        body: "{}",
      }),
      config,
      f,
    );
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie().join(";")).not.toMatch(/store_session=/);
  });

  it("clears the cookie on an allauth 401 for a user who is not signed in", async () => {
    const f = upstream(
      Response.json(
        { status: 401, data: { flows: [{ id: "login" }] }, meta: { is_authenticated: false } },
        { status: 401 },
      ),
    );
    const res = await forward(
      new Request("http://web/api/auth/auth/session", { headers: { cookie: "store_session=old" } }),
      config,
      f,
    );
    expect(res.headers.getSetCookie().join(";")).toMatch(/store_session=;.*Max-Age=0/);
  });

  it("relays upstream Set-Cookie (basket, csrf) to the browser", async () => {
    const up = new Response("{}", { headers: { "content-type": "application/json" } });
    up.headers.append("set-cookie", "oscar_open_basket=9_x; Path=/; HttpOnly");
    const res = await forward(new Request("http://web/api/store/csrf"), config, upstream(up));
    expect(res.headers.getSetCookie()).toContain("oscar_open_basket=9_x; Path=/; HttpOnly");
  });

  it("exposes only the health endpoint for uptime checks, at /api/health", async () => {
    const f = upstream(Response.json({ status: "ok" }));
    const res = await forward(new Request("http://web/api/health"), config, f);
    expect(res.status).toBe(200);
    expect(f.mock.calls[0]?.[0]).toBe("http://api:8000/health");
    const g = upstream(Response.json({}));
    expect((await forward(new Request("http://web/api/health/x"), config, g)).status).toBe(404);
    expect(g).not.toHaveBeenCalled();
  });

  it("does not forward unknown API prefixes", async () => {
    const f = upstream(Response.json({}));
    const res = await forward(new Request("http://web/api/secret"), config, f);
    expect(res.status).toBe(404);
    expect(f).not.toHaveBeenCalled();
  });

  it("forwards the browser's real Origin instead of inventing one", async () => {
    const f = upstream(Response.json({}));
    await forward(
      new Request("http://web/api/store/basket/lines", {
        method: "POST",
        body: "{}",
        headers: { origin: "http://web", cookie: "csrftoken=abc" },
      }),
      config,
      f,
    );
    expect(headersOf(f).get("origin")).toBe("http://web");
  });

  it("rejects unsafe requests from another origin without calling Django", async () => {
    const f = upstream(Response.json({}));
    const res = await forward(
      new Request("http://web/api/store/basket/lines", {
        method: "POST",
        body: "{}",
        headers: { origin: "https://evil.example", cookie: "csrftoken=abc" },
      }),
      config,
      f,
    );
    expect(res.status).toBe(403);
    expect(f).not.toHaveBeenCalled();
  });

  it("rejects unsafe requests flagged cross-site by the browser", async () => {
    const f = upstream(Response.json({}));
    const res = await forward(
      new Request("http://web/api/store/basket/lines", {
        method: "POST",
        body: "{}",
        headers: { "sec-fetch-site": "cross-site" },
      }),
      config,
      f,
    );
    expect(res.status).toBe(403);
  });

  it("does not leak the internal API origin in Location", async () => {
    const up = new Response(null, {
      status: 301,
      headers: { location: "http://api:8000/api/store/csrf/" },
    });
    const res = await forward(new Request("https://web/api/store/csrf"), config, upstream(up));
    expect(res.headers.get("location")).toBe("https://web/api/store/csrf/");
  });

  it("uses the first x-forwarded-proto value for the Secure flag", async () => {
    const f = upstream(Response.json({ meta: { session_token: "t" } }));
    const res = await forward(
      new Request("http://web/api/auth/auth/login", {
        method: "POST",
        body: "{}",
        headers: { "x-forwarded-proto": "https,http" },
      }),
      config,
      f,
    );
    expect(res.headers.getSetCookie().join(";")).toMatch(/Secure/);
  });

  describe("first-time guest CSRF", () => {
    function csrfThenOk() {
      return vi.fn(async (url: string, _init: RequestInit) => {
        if (url.endsWith("/api/store/csrf")) {
          const h = new Headers();
          h.append("set-cookie", "csrftoken=issued123; HttpOnly; Path=/; SameSite=Lax");
          return new Response(JSON.stringify({ csrf_token: "masked" }), {
            headers: h,
          });
        }
        return Response.json({ ok: true }, { status: 201 });
      });
    }
    const post = (headers: Record<string, string> = {}) =>
      new Request("http://web/api/store/basket/lines", {
        method: "POST",
        body: "{}",
        headers: { "content-type": "application/json", ...headers },
      });

    it("fetches a token when the guest has no CSRF cookie and forwards the cookie to the browser", async () => {
      const f = csrfThenOk();
      const res = await forward(post({ cookie: "oscar_open_basket=7_abc" }), config, f);
      expect(f.mock.calls.map((c) => c[0])).toEqual([
        "http://api:8000/api/store/csrf",
        "http://api:8000/api/store/basket/lines",
      ]);
      const h = new Headers(f.mock.calls[1]?.[1]?.headers);
      expect(h.get("x-csrftoken")).toBe("issued123");
      expect(h.get("cookie")).toBe("oscar_open_basket=7_abc; csrftoken=issued123");
      expect(res.status).toBe(201);
      expect(res.headers.getSetCookie().join(";")).toContain("csrftoken=issued123");
    });

    it("does not fetch a token when the guest already has one", async () => {
      const f = csrfThenOk();
      await forward(post({ cookie: "csrftoken=have" }), config, f);
      expect(f).toHaveBeenCalledTimes(1);
      expect(new Headers(f.mock.calls[0]?.[1]?.headers).get("x-csrftoken")).toBe("have");
    });

    it("does not fetch a token for safe methods, signed-in users or non-store paths", async () => {
      const get = csrfThenOk();
      await forward(new Request("http://web/api/store/basket"), config, get);
      expect(get).toHaveBeenCalledTimes(1);

      const signedIn = csrfThenOk();
      await forward(post({ cookie: "store_session=tok" }), config, signedIn);
      expect(signedIn).toHaveBeenCalledTimes(1);

      const admin = csrfThenOk();
      await forward(
        new Request("http://web/api/admin/products", { method: "POST", body: "{}" }),
        config,
        admin,
      );
      expect(admin).toHaveBeenCalledTimes(1);
    });

    it("still forwards the write, without a token, if Django issues none", async () => {
      const f = vi.fn(async (_url: string, _init: RequestInit) =>
        Response.json({ code: "csrf_failed" }, { status: 403 }),
      );
      const res = await forward(post(), config, f);
      expect(res.status).toBe(403);
      expect(f).toHaveBeenCalledTimes(2);
      expect(new Headers(f.mock.calls[1]?.[1]?.headers).get("x-csrftoken")).toBeNull();
    });

    it("does not call the API from a cross-site write", async () => {
      const f = csrfThenOk();
      const res = await forward(post({ origin: "https://evil.example" }), config, f);
      expect(res.status).toBe(403);
      expect(f).not.toHaveBeenCalled();
    });
  });
});
