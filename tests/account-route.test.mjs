import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server.js";
import { POST } from "../src/app/api/account/route.ts";

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
    if (url.endsWith("/logout")) return Response.json({}, { status: expired ? 401 : 200 });
    return Response.json({ customer: { id: 1, name: "Ana", email: "ana@example.test" } });
  };
  const request = (body, origin = "https://shop.example.test") => new NextRequest("https://shop.example.test/api/account", {
    method: "POST", headers: { origin, cookie: "magico_customer=test-token" }, body: JSON.stringify(body),
  });
  try {
    assert.equal((await POST(request({ action: "login" }, "https://other.example"))).status, 403);
    assert.equal(calls.length, 0);
    const registered = await POST(request({ action: "register", name: "Ana", email: "ana@example.test", password: "test-password-123", roles: ["admin"], enableAPIKey: true }));
    assert.equal(registered.status, 200);
    assert.match(registered.headers.get("set-cookie"), /HttpOnly/);
    assert.match(registered.headers.get("set-cookie"), /Secure/);
    assert.equal(JSON.stringify(await registered.json()).includes("test-token"), false);
    expired = true;
    const logout = await POST(request({ action: "logout" }));
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
  } finally {
    globalThis.fetch = original;
    process.env = environment;
  }
});
