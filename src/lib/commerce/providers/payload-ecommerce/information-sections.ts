import { richTextToHtml, richTextToPlain } from "@/lib/cms/richtext";
import type { ProductInformationSection } from "@/types/commerce";

function localized(value: unknown, locale: string, fallback: string): unknown {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !("root" in value) &&
    !("type" in value)
  ) {
    const record = value as Record<string, unknown>;
    return richTextToPlain(record[locale]).trim()
      ? record[locale]
      : record[fallback];
  }
  return value;
}

/** Proyecta solo contenido público, después del fallback configurado. */
export function mapInformationSections(
  value: unknown,
  locale: string,
  fallback: string,
): ProductInformationSection[] {
  if (!Array.isArray(value)) return [];
  const used = new Set<string>();
  return value.flatMap((entry): ProductInformationSection[] => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    if (
      row.isVisible === false ||
      typeof row.key !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.key) ||
      used.has(row.key)
    )
      return [];
    const titleValue = localized(row.title, locale, fallback);
    const title = typeof titleValue === "string" ? titleValue.trim() : "";
    const body = localized(row.body, locale, fallback);
    if (!title || !richTextToPlain(body).trim()) return [];
    used.add(row.key);
    return [{ key: row.key, title, content: richTextToHtml(body) }];
  });
}
