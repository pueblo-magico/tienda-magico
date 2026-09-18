import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { CmsSettings } from "../apps/cms/src/globals/CmsSettings.ts";
import {
  CMS_NAVIGATION_ITEMS,
  CMS_VISIBILITY_ROLES,
  defaultCmsNavigationVisibility,
  filterVisibleEntities,
  parseCmsNavigationVisibility,
} from "../apps/cms/src/utilities/cmsNavigation.ts";

const expectedCollections = [
  "payment-notifications",
  "users",
  "media",
  "localSales",
  "pages",
  "posts",
  "testimonials",
  "faqs",
  "categories",
  "brands",
  "tags",
  "addresses",
  "variants",
  "variantTypes",
  "variantOptions",
  "products",
  "carts",
  "orders",
  "transactions",
];

const expectedGlobals = [
  "header",
  "footer",
  "site-settings",
  "commerce-settings",
  "seo",
];

test("CMS settings cover every current visible admin section", () => {
  assert.deepEqual(
    CMS_NAVIGATION_ITEMS.filter((item) => item.entityType === "collection").map(
      (item) => item.slug,
    ),
    expectedCollections,
  );
  assert.deepEqual(
    CMS_NAVIGATION_ITEMS.filter((item) => item.entityType === "global").map(
      (item) => item.slug,
    ),
    expectedGlobals,
  );
  assert.ok(
    Object.values(defaultCmsNavigationVisibility).every(Boolean),
    "existing sections must remain visible by default",
  );
});

test("CMS settings are private and cannot hide their own navigation entry", () => {
  assert.equal(CmsSettings.slug, "cms-settings");
  assert.equal(CmsSettings.access?.read?.({ req: { user: null } }), false);
  assert.equal(CmsSettings.access?.update?.({ req: { user: null } }), false);
  assert.equal(
    CMS_NAVIGATION_ITEMS.some((item) => item.slug === "cms-settings"),
    false,
  );
});

test("CMS visibility controls use the switch presentation", () => {
  const sectionFields = CmsSettings.fields.flatMap((field) =>
    "fields" in field ? field.fields : [],
  );
  const fields = sectionFields.filter(
    (field) => "type" in field && field.type === "checkbox",
  );
  const headers = sectionFields.filter(
    (field) => "type" in field && field.type === "ui",
  );

  assert.equal(fields.length, CMS_NAVIGATION_ITEMS.length);
  assert.ok(
    fields.every(
      (field) =>
        "admin" in field && field.admin?.className === "cms-visibility-switch",
    ),
  );
  assert.equal(headers.length, 3);
  assert.ok(
    headers.every(
      (field) =>
        "admin" in field &&
        field.admin?.components?.Field ===
          "@/components/CmsVisibilityRoleHeader",
    ),
  );
  assert.deepEqual(CMS_VISIBILITY_ROLES, [
    { key: "admin", enabled: true },
    { key: "editor", enabled: false },
    { key: "customer", enabled: false },
  ]);
  assert.ok(
    fields.every(
      (field) =>
        "admin" in field &&
        field.admin?.components?.Field ===
          "@/components/CmsVisibilityRoleField",
    ),
  );
});

test("the active role switch saves its new value immediately", async () => {
  const component = await readFile(
    new URL(
      "../apps/cms/src/components/CmsVisibilityRoleField.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(component, /useForm\(\)/);
  assert.match(component, /await submit\(\{/);
  assert.match(component, /overrides:\s*\{\s*\[props\.path\]: nextValue\s*\}/);
});

test("navigation visibility removes only explicitly disabled entities", () => {
  const result = filterVisibleEntities(
    {
      collections: [...expectedCollections],
      globals: [...expectedGlobals, "cms-settings"],
    },
    {
      ...defaultCmsNavigationVisibility,
      pages: false,
      orders: false,
      seo: false,
    },
  );

  assert.equal(result.collections.includes("pages"), false);
  assert.equal(result.collections.includes("orders"), false);
  assert.equal(result.globals.includes("seo"), false);
  assert.equal(result.globals.includes("cms-settings"), true);
  assert.equal(result.collections.includes("products"), true);
});

test("persisted settings ignore metadata and default missing flags to visible", () => {
  const visibility = parseCmsNavigationVisibility({
    id: 1,
    pages: false,
    products: "false",
  });

  assert.equal(visibility.pages, false);
  assert.equal(visibility.products, true);
  assert.equal("id" in visibility, false);
});
