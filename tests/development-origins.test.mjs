import assert from "node:assert/strict";
import test from "node:test";
import { developmentOrigins } from "../src/config/development-origins.ts";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  blockCrossSiteDEV,
} = require("next/dist/server/lib/router-utils/block-cross-site-dev");

test("habilita únicamente el hostname explícito del túnel en desarrollo", () => {
  assert.deepEqual(
    developmentOrigins("https://prueba.example/", "development"),
    ["prueba.example"],
  );
  assert.deepEqual(
    developmentOrigins("https://prueba.example", "production"),
    [],
  );
  assert.deepEqual(developmentOrigins(undefined, "development"), []);
  for (const invalid of [
    "*",
    "https://*.example",
    "https://user:password@example.com",
    "https://example.com/path",
    "http://example.com",
    "https://example.com?key=secret",
  ]) {
    assert.throws(() => developmentOrigins(invalid, "development"));
  }
});

test("Next permite scripts y HMR del túnel sin habilitar otros orígenes", () => {
  const allowed = developmentOrigins("https://prueba.example", "development");
  for (const url of ["/_next/static/chunks/app.js", "/_next/webpack-hmr"]) {
    const response = { statusCode: 200, end() {} };
    assert.equal(
      blockCrossSiteDEV(
        { url, headers: { origin: "https://prueba.example" } },
        response,
        allowed,
        "localhost",
      ),
      false,
    );
    assert.equal(
      blockCrossSiteDEV(
        { url, headers: { origin: "https://untrusted.example" } },
        response,
        allowed,
        "localhost",
      ),
      true,
    );
    assert.equal(response.statusCode, 403);
  }
});
