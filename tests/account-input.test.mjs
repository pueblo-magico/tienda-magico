import test from "node:test";
import assert from "node:assert/strict";
import { accountInput } from "../src/lib/account/input.ts";
test("registro descarta privilegios y normaliza datos", () => {
  assert.deepEqual(accountInput({ action: "register", name: " Ana ", email: " ANA@example.test ", password: "test-password-123", roles: ["admin"], enableAPIKey: true }), { action: "register", name: "Ana", email: "ana@example.test", password: "test-password-123" });
});
test("rechaza contraseñas débiles y datos inválidos", () => {
  assert.equal(accountInput({ action: "register", email: "a@b.test", name: "A", password: "short" }), null);
  assert.equal(accountInput({ action: "login", email: "bad", password: "password" }), null);
});
