import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { GET, POST } from "../src/app/api/staff/cash/route.ts";

test("caja: cookie privada, CSRF, límites de autorización y respuestas sin secretos", async () => {
  const originalFetch = globalThis.fetch;
  const originalURL = process.env.PAYLOAD_CMS_URL;
  const originalMode = process.env.NODE_ENV;
  process.env.PAYLOAD_CMS_URL = "https://cms.example.test";
  process.env.NODE_ENV = "production";
  let calls = 0;
  let upstream = { token: "token-de-prueba-no-real", expiresIn: 900 };
  globalThis.fetch = async (url, init) => {
    calls++;
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "error");
    assert.equal(new URL(url).hostname, "cms.example.test");
    return Response.json(upstream);
  };
  const request = (data, origin = "https://shop.example.test", cookie = "") =>
    new NextRequest("https://shop.example.test/api/staff/cash", {
      method: "POST",
      headers: { origin, cookie, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  try {
    assert.equal(
      (
        await POST(
          request(
            { action: "login", password: "prueba" },
            "https://evil.example",
          ),
        )
      ).status,
      403,
    );
    assert.equal(calls, 0);
    const login = await POST(request({ action: "login", password: "prueba" }));
    assert.deepEqual(await login.json(), { authenticated: true });
    const cookie = login.headers.get("set-cookie");
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /Secure/i);
    assert.match(cookie, /SameSite=strict/i);
    assert.match(cookie, /Max-Age=900/i);
    assert.match(cookie, /Path=\/api\/staff\/cash/);
    const cookieHeader = cookie.split(";")[0];
    assert.equal(
      (await GET(new NextRequest("https://shop.example.test/api/staff/cash")))
        .status,
      401,
    );
    assert.equal(calls, 1);
    assert.equal(
      (
        await POST(
          request({
            action: "confirm",
            reference: "00000000-0000-4000-8000-000000000001",
            amount: 10000,
            received: true,
          }),
        )
      ).status,
      401,
    );
    assert.equal(calls, 1);
    upstream = {
      order: {
        reference: "00000000-0000-4000-8000-000000000001",
        amount: 10000,
        currency: "ARS",
        status: "pending",
        buyerName: null,
        cartReference: "privado",
        hash: "privado",
      },
    };
    const detail = await POST(
      request(
        { action: "order", reference: upstream.order.reference },
        undefined,
        cookieHeader,
      ),
    );
    assert.equal(detail.status, 200);
    assert.equal(
      JSON.stringify(await detail.json()).includes("privado"),
      false,
    );
    assert.match(detail.headers.get("cache-control"), /no-store/);
    upstream = { success: true };
    const logout = await POST(
      request({ action: "logout" }, undefined, cookieHeader),
    );
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
    globalThis.fetch = async () => {
      throw new Error("Detalle privado");
    };
    const failure = await POST(
      request({ action: "login", password: "prueba" }),
    );
    assert.equal(failure.status, 503);
    assert.deepEqual(await failure.json(), { code: "unavailable" });
    assert.equal(
      (await POST(request({ action: "login", password: "x".repeat(3000) })))
        .status,
      400,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalURL === undefined) delete process.env.PAYLOAD_CMS_URL;
    else process.env.PAYLOAD_CMS_URL = originalURL;
    if (originalMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalMode;
  }
});
