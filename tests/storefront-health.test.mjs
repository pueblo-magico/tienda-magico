import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("Docker comprueba la salud sin renderizar el catálogo", async () => {
  const compose = await readFile("deploy/manual/compose.yml", "utf8");
  assert.ok(compose.includes("http://127.0.0.1:3000/api/health"));
  const workflow = await readFile(".github/workflows/deploy.yml", "utf8");
  assert.ok(workflow.includes('check_endpoint "Storefront" "$SHOP_URL/"'));
});

test("salud devuelve 200 sin caché ni dependencias externas", async () => {
  const { GET } = await import("../src/app/api/health/route.ts");
  const response = GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});
