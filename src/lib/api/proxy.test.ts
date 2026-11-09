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

  it("relays upstream Set-Cookie (basket, csrf) to the browser", async () => {
    const up = new Response("{}", { headers: { "content-type": "application/json" } });
    up.headers.append("set-cookie", "oscar_open_basket=9_x; Path=/; HttpOnly");
    const res = await forward(new Request("http://web/api/store/csrf"), config, upstream(up));
    expect(res.headers.getSetCookie()).toContain("oscar_open_basket=9_x; Path=/; HttpOnly");
  });

  it("does not forward unknown API prefixes", async () => {
    const f = upstream(Response.json({}));
    const res = await forward(new Request("http://web/api/secret"), config, f);
    expect(res.status).toBe(404);
    expect(f).not.toHaveBeenCalled();
  });
});
