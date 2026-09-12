import assert from "node:assert/strict";
import { test } from "node:test";

import { Users } from "../apps/cms/src/collections/Users.ts";

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
