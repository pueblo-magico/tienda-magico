import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server.js";
import { GET, POST } from "../src/app/api/account/route.ts";

test("cuentas: CSRF, privilegios, cookie privada y cierre de sesión vencida", async () => {
  const original = globalThis.fetch;
  const environment = { ...process.env };
  process.env.PAYLOAD_CMS_URL = "https://cms.example.test";
  process.env.PAYLOAD_CMS_API_KEY = "test-service-key";
  let expired = false;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(url);
    assert.equal(init.cache, "no-store");
    if (url.endsWith("/users")) {
      assert.deepEqual(JSON.parse(init.body).roles, ["customer"]);
      assert.equal(JSON.parse(init.body).enableAPIKey, false);
      return Response.json({});
    }
    if (url.endsWith("/login")) return Response.json({ token: "test-token" });
    if (url.endsWith("/logout"))
      return Response.json({}, { status: expired ? 401 : 200 });
    return Response.json({
      customer: { id: 1, name: "Ana", email: "ana@example.test" },
    });
  };
  const request = (body, origin = "https://shop.example.test") =>
    new NextRequest("https://shop.example.test/api/account", {
      method: "POST",
      headers: { origin, cookie: "magico_customer=test-token" },
      body: JSON.stringify(body),
    });
  try {
    assert.equal(
      (await POST(request({ action: "login" }, "https://other.example")))
        .status,
      403,
    );
    assert.equal(calls.length, 0);
    const registered = await POST(
      request({
        action: "register",
        name: "Ana",
        email: "ana@example.test",
        password: "test-password-123",
        roles: ["admin"],
        enableAPIKey: true,
      }),
    );
    assert.equal(registered.status, 200);
    assert.match(registered.headers.get("set-cookie"), /HttpOnly/);
    assert.match(registered.headers.get("set-cookie"), /Secure/);
    assert.equal(
      JSON.stringify(await registered.json()).includes("test-token"),
      false,
    );
    expired = true;
    const logout = await POST(request({ action: "logout" }));
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
  } finally {
    globalThis.fetch = original;
    process.env = environment;
  }
});

test("cuentas: visitantes, sesiones rechazadas y errores no exponen credenciales", async () => {
  const original = globalThis.fetch;
  const environment = { ...process.env };
  process.env.PAYLOAD_CMS_URL = "https://cms.example.test";
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ secret: "private-detail" }, { status: 401 });
  };
  try {
    const anonymous = await GET(
      new NextRequest("https://shop.example.test/api/account"),
    );
    assert.deepEqual(await anonymous.json(), { customer: null });
    assert.equal(calls, 0);
    const expired = await GET(
      new NextRequest("https://shop.example.test/api/account", {
        headers: { cookie: "magico_customer=expired" },
      }),
    );
    assert.deepEqual(await expired.json(), { customer: null });
    globalThis.fetch = async () => {
      throw new Error("private-detail");
    };
    const unavailable = await GET(
      new NextRequest("https://shop.example.test/api/account", {
        headers: { cookie: "magico_customer=expired" },
      }),
    );
    assert.equal(unavailable.status, 503);
    assert.equal((await unavailable.text()).includes("private-detail"), false);
    const oversized = await POST(
      new NextRequest("https://shop.example.test/api/account", {
        method: "POST",
        headers: { origin: "https://shop.example.test" },
        body: " ".repeat(4097),
      }),
    );
    assert.equal(oversized.status, 400);
    delete process.env.PAYLOAD_CMS_URL;
    delete process.env.PAYLOAD_ECOMMERCE_URL;
    const missing = await GET(
      new NextRequest("https://shop.example.test/api/account", {
        headers: { cookie: "magico_customer=test" },
      }),
    );
    assert.equal(missing.status, 503);
  } finally {
    globalThis.fetch = original;
    process.env = environment;
  }
});

test("ingreso vincula solo referencias secretas del navegador y no publica credenciales", async () => {
  const original = globalThis.fetch;
  const environment = { ...process.env };
  process.env.PAYLOAD_CMS_URL = "https://cms.example.test";
  const reference = `42::${"b".repeat(40)}`;
  let linkFails = false;
  let links = 0;
  globalThis.fetch = async (url, init) => {
    if (url.endsWith("/login"))
      return Response.json({ token: "new-private-session" });
    if (url.endsWith("/link")) {
      links++;
      assert.deepEqual(JSON.parse(init.body), { references: [reference] });
      assert.equal(init.headers.Authorization, "JWT new-private-session");
      return Response.json(
        { ok: !linkFails },
        { status: linkFails ? 503 : 200 },
      );
    }
    return Response.json({
      customer: { id: 1, name: "Ana", email: "link@example.test" },
    });
  };
  const request = () =>
    new NextRequest("https://shop.example.test/api/account", {
      method: "POST",
      headers: {
        origin: "https://shop.example.test",
        cookie: `magico_guest_orders=${encodeURIComponent(JSON.stringify([reference, "42", "public-uuid"]))}`,
      },
      body: JSON.stringify({
        action: "login",
        email: "link@example.test",
        password: "existing-password",
        references: [`43::${"c".repeat(40)}`],
      }),
    });
  try {
    const response = await POST(request());
    assert.equal(response.status, 200);
    assert.equal(links, 1);
    assert.match(response.headers.get("set-cookie"), /SameSite=lax/i);
    assert.match(response.headers.get("set-cookie"), /Max-Age=7200/);
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.deepEqual(await response.json(), {
      customer: { id: 1, name: "Ana", email: "link@example.test" },
    });
    linkFails = true;
    const failed = await POST(request());
    assert.equal(failed.status, 400);
    assert.equal(failed.headers.get("set-cookie"), null);
    assert.deepEqual(await failed.json(), { error: "unavailable" });
  } finally {
    globalThis.fetch = original;
    process.env = environment;
  }
});

test("los intentos fallidos tienen respuesta genérica y el límite no bloquea cerrar sesión", async () => {
  const original = globalThis.fetch;
  const environment = { ...process.env };
  process.env.PAYLOAD_CMS_URL = "https://cms.example.test";
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ error: "private-provider-detail" }, { status: 401 });
  };
  const request = (action = "login") =>
    new NextRequest("https://shop.example.test/api/account", {
      method: "POST",
      headers: { origin: "https://shop.example.test" },
      body: JSON.stringify({
        action,
        email: "limited@example.test",
        password: "incorrect",
      }),
    });
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await POST(request());
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "unavailable" });
    }
    const limited = await POST(request());
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get("retry-after"), "60");
    assert.equal(calls, 5);
    assert.equal((await POST(request("logout"))).status, 200);
  } finally {
    globalThis.fetch = original;
    process.env = environment;
  }
});
