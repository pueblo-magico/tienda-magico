import assert from "node:assert/strict";
import test from "node:test";
import { allowAccountAttempt } from "../src/lib/account/rate-limit.ts";

test("limita intentos por cuenta sin bloquear a otros compradores y renueva la ventana", () => {
  const now = 100000;
  for (let attempt = 0; attempt < 5; attempt++)
    assert.equal(allowAccountAttempt("ana@example.test", now), true);
  assert.equal(allowAccountAttempt("ana@example.test", now), false);
  assert.equal(allowAccountAttempt("bea@example.test", now), true);
  assert.equal(allowAccountAttempt("ana@example.test", now + 60000), true);
});
