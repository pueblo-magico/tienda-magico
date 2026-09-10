export type CatalogRevalidationEvent = {
  resource: "product" | "media";
  slugs: string[];
};

export function parseCatalogRevalidationEvent(
  value: unknown,
): CatalogRevalidationEvent | null {
  if (!value || typeof value !== "object") return null;
  const body = value as { resource?: unknown; slugs?: unknown };
  if (body.resource !== "product" && body.resource !== "media") return null;
  if (!Array.isArray(body.slugs) || body.slugs.length > 10) return null;
  const slugs = body.slugs.filter(
    (slug): slug is string =>
      typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),
  );
  if (slugs.length !== body.slugs.length) return null;
  return { resource: body.resource, slugs: [...new Set(slugs)] };
}

export function catalogRevalidationTags(event: CatalogRevalidationEvent) {
  const tags = new Set(["products", "payload-products"]);
  if (event.resource === "product") {
    for (const slug of event.slugs) tags.add(`product:${slug}`);
  }
  return [...tags];
}

export function isRevalidationSecretValid(
  received: string | null,
  expected: string,
) {
  if (!received) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
import { timingSafeEqual } from "node:crypto";
