import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { revalidateStorefrontProduct } from "../apps/cms/src/hooks/revalidateStorefrontCatalog.ts";

const originalUrl = process.env.STOREFRONT_REVALIDATION_URL;
const originalSecret = process.env.STOREFRONT_REVALIDATION_SECRET;

afterEach(() => {
  mock.restoreAll();
  if (originalUrl === undefined) delete process.env.STOREFRONT_REVALIDATION_URL;
  else process.env.STOREFRONT_REVALIDATION_URL = originalUrl;
  if (originalSecret === undefined)
    delete process.env.STOREFRONT_REVALIDATION_SECRET;
  else process.env.STOREFRONT_REVALIDATION_SECRET = originalSecret;
});

function request(warnings = []) {
  return { payload: { logger: { warn: (message) => warnings.push(message) } } };
}

test("el CMS firma la revalidación con los slugs anterior y actual", async () => {
  process.env.STOREFRONT_REVALIDATION_URL =
    "https://tienda.example/api/revalidate/catalog";
  process.env.STOREFRONT_REVALIDATION_SECRET = "secreto-compartido";
  const calls = [];
  mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return new Response(null, { status: 200 });
  });

  const doc = { slug: "slug-nuevo" };
  const result = await revalidateStorefrontProduct({
    doc,
    previousDoc: { slug: "slug-anterior" },
    req: request(),
  });

  assert.strictEqual(result, doc);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, process.env.STOREFRONT_REVALIDATION_URL);
  assert.equal(
    calls[0].init.headers["x-revalidation-secret"],
    "secreto-compartido",
  );
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    resource: "product",
    slugs: ["slug-nuevo", "slug-anterior"],
  });
});

test("la revalidación sin configurar no hace solicitudes", async () => {
  delete process.env.STOREFRONT_REVALIDATION_URL;
  delete process.env.STOREFRONT_REVALIDATION_SECRET;
  const fetchMock = mock.method(globalThis, "fetch", async () => {
    throw new Error("No debería ejecutarse");
  });

  await revalidateStorefrontProduct({
    doc: { slug: "producto" },
    previousDoc: null,
    req: request(),
  });
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("la creación sin documento anterior envía solamente el slug nuevo", async () => {
  process.env.STOREFRONT_REVALIDATION_URL =
    "https://tienda.example/api/revalidate/catalog";
  process.env.STOREFRONT_REVALIDATION_SECRET = "secreto-compartido";
  let body;
  mock.method(globalThis, "fetch", async (_url, init) => {
    body = JSON.parse(init.body);
    return new Response(null, { status: 200 });
  });

  await revalidateStorefrontProduct({
    doc: { slug: "producto-nuevo" },
    previousDoc: null,
    req: request(),
  });

  assert.deepEqual(body, { resource: "product", slugs: ["producto-nuevo"] });
});

test("un fallo remoto no bloquea el guardado ni filtra el secreto", async () => {
  process.env.STOREFRONT_REVALIDATION_URL =
    "https://tienda.example/api/revalidate/catalog";
  process.env.STOREFRONT_REVALIDATION_SECRET = "secreto-que-no-debe-filtrarse";
  mock.method(globalThis, "fetch", async () => {
    throw new Error("offline secreto-que-no-debe-filtrarse");
  });
  const warnings = [];
  const doc = { slug: "producto" };

  const result = await revalidateStorefrontProduct({
    doc,
    previousDoc: null,
    req: request(warnings),
  });

  assert.strictEqual(result, doc);
  assert.equal(warnings.length, 1);
  assert.doesNotMatch(warnings[0], /secreto-que-no-debe-filtrarse/);
});
