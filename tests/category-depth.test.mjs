import assert from "node:assert/strict";
import { test } from "node:test";
import { preventCategoryCycles } from "../apps/cms/src/collections/categoryHierarchy.ts";

test("el CMS rechaza un cuarto nivel de categorías", async () => {
  const parents = new Map([
    ["nivel-3", { id: "nivel-3", parent: "nivel-2" }],
    ["nivel-2", { id: "nivel-2", parent: "nivel-1" }],
    ["nivel-1", { id: "nivel-1", parent: null }],
  ]);

  await assert.rejects(
    preventCategoryCycles({
      data: { parent: "nivel-3" },
      originalDoc: undefined,
      req: {
        locale: "es",
        payload: {
          findByID: async ({ id }) => parents.get(String(id)),
        },
      },
    }),
    /tres niveles/,
  );
});
