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

test("el CMS permite exactamente tres niveles", async () => {
  const parents = new Map([
    ["nivel-2", { id: "nivel-2", parent: "nivel-1" }],
    ["nivel-1", { id: "nivel-1", parent: null }],
  ]);
  const data = { parent: "nivel-2" };

  assert.equal(
    await preventCategoryCycles({
      data,
      originalDoc: undefined,
      req: {
        locale: "es",
        payload: {
          findByID: async ({ id }) => parents.get(String(id)),
        },
      },
    }),
    data,
  );
});

test("el CMS rechaza mover un subárbol cuando sus hijos superarían tres niveles", async () => {
  const parents = new Map([
    ["nivel-2", { id: "nivel-2", parent: "nivel-1" }],
    ["nivel-1", { id: "nivel-1", parent: null }],
  ]);
  const children = new Map([
    ["categoria", [{ id: "hija" }]],
    ["hija", [{ id: "nieta" }]],
    ["nieta", []],
  ]);

  await assert.rejects(
    preventCategoryCycles({
      data: { parent: "nivel-2" },
      originalDoc: { id: "categoria", parent: null },
      req: {
        locale: "es",
        payload: {
          findByID: async ({ id }) => parents.get(String(id)),
          find: async ({ where }) => ({
            docs: children.get(String(where.parent.equals)) ?? [],
          }),
        },
      },
    }),
    /tres niveles/,
  );
});

test("el CMS valida los descendientes aunque una categoría se mueva a la raíz", async () => {
  const children = new Map([
    ["categoria", [{ id: "hija" }]],
    ["hija", [{ id: "nieta" }]],
    ["nieta", [{ id: "bisnieta" }]],
    ["bisnieta", []],
  ]);

  await assert.rejects(
    preventCategoryCycles({
      data: { parent: null },
      originalDoc: { id: "categoria", parent: "anterior" },
      req: {
        locale: "es",
        payload: {
          findByID: async () => null,
          find: async ({ where }) => ({
            docs: children.get(String(where.parent.equals)) ?? [],
          }),
        },
      },
    }),
    /tres niveles/,
  );
});

test("el CMS conserva el padre existente cuando una actualización parcial no lo incluye", async () => {
  const parents = new Map([
    ["nivel-2", { id: "nivel-2", parent: "nivel-1" }],
    ["nivel-1", { id: "nivel-1", parent: null }],
  ]);

  await assert.rejects(
    preventCategoryCycles({
      data: { title: "Título actualizado" },
      originalDoc: { id: "categoria", parent: "nivel-2" },
      req: {
        locale: "es",
        payload: {
          findByID: async ({ id }) => parents.get(String(id)),
          find: async ({ where }) => ({
            docs:
              String(where.parent.equals) === "categoria"
                ? [{ id: "hija" }]
                : [],
          }),
        },
      },
    }),
    /tres niveles/,
  );
});
