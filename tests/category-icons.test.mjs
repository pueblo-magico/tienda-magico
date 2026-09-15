import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("categories preserve valid Lucide icon names from Payload", async () => {
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.test";
  const { mapCollectionSummary } =
    await import("@/lib/commerce/providers/payload-ecommerce/mappers");
  const category = mapCollectionSummary({
    id: 1,
    title: "Cámaras",
    slug: "camaras",
    icon: "camera",
  });

  assert.equal(category.icon, "camera");
});

test("the CMS icon selector and storefront use Lucide's dynamic registry", async () => {
  const [collection, description, cmsField, storefrontIcon] = await Promise.all(
    [
      readFile("apps/cms/src/collections/Categories.ts", "utf8"),
      readFile(
        "apps/cms/src/components/LucideIconFieldDescription.tsx",
        "utf8",
      ),
      readFile("apps/cms/src/components/LucideIconSelectField.tsx", "utf8"),
      readFile("src/components/CategoryIcon.tsx", "utf8"),
    ],
  );

  assert.match(collection, /iconNames\.map/);
  assert.match(collection, /Description:.*LucideIconFieldDescription/s);
  assert.match(collection, /Field:.*LucideIconSelectField/s);
  assert.match(description, /https:\/\/lucide\.dev\/icons\//);
  assert.match(cmsField, /<DynamicIcon[^>]+name=\{data\.value\}/s);
  assert.match(storefrontIcon, /<DynamicIcon[^>]+name=\{name\}/s);
});
