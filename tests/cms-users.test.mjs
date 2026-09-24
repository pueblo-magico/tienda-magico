import assert from "node:assert/strict";
import { test } from "node:test";

import { Users } from "../apps/cms/src/collections/Users.ts";

test("clientes no administran usuarios ni generan claves API propias", async () => {
  const customer = {
    id: 4,
    roles: ["customer"],
    email: "customer@example.test",
  };
  const req = { user: customer };
  assert.equal(await Users.access.admin({ req }), false);
  assert.equal(await Users.access.update({ req }), false);
  assert.equal(await Users.access.update({ req: { user: null } }), false);
  assert.equal(
    await Users.access.update({ req: { user: { id: 1, roles: ["admin"] } } }),
    true,
  );
});

test("CMS users have a configurable editor language", () => {
  const field = Users.fields.find(
    (candidate) => "name" in candidate && candidate.name === "editorLanguage",
  );

  assert.ok(field);
  assert.equal(field.type, "select");
  assert.equal(field.required, true);
  assert.equal(field.defaultValue, "es");
  assert.deepEqual(field.label, {
    es: "Idioma del editor",
    en: "Editor language",
  });
  assert.deepEqual(field.options, [
    { label: { es: "Español", en: "Spanish" }, value: "es" },
    { label: { es: "Inglés", en: "English" }, value: "en" },
  ]);
});
