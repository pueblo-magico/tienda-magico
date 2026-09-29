import assert from "node:assert/strict";
import test from "node:test";
import { linkCustomerOrders } from "../src/lib/account/server.ts";

test("una sesión vencida no bloquea el checkout invitado, pero un fallo de vinculación no se oculta", async () => {
  const previousFetch = globalThis.fetch;
  const environment = { ...process.env };
  process.env.PAYLOAD_CMS_URL = "https://cms.example.test";
  const references = [`1::${"a".repeat(40)}`];
  try {
    globalThis.fetch = async () => Response.json({}, { status: 401 });
    assert.equal(await linkCustomerOrders(references, "expired"), false);
    globalThis.fetch = async () => Response.json({ ok: true });
    assert.equal(await linkCustomerOrders(references, "active"), true);
    globalThis.fetch = async () => Response.json({}, { status: 503 });
    await assert.rejects(linkCustomerOrders(references, "active"));
  } finally {
    globalThis.fetch = previousFetch;
    process.env = environment;
  }
});
