import type { CollectionSummary } from "@/types/commerce";

export type CategoryTreeNode = {
  category: CollectionSummary;
  children: CategoryTreeNode[];
};

function compareCategories(a: CollectionSummary, b: CollectionSummary) {
  const order = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
  return order || a.title.localeCompare(b.title);
}

export function buildCategoryTree(
  categories: CollectionSummary[],
): CategoryTreeNode[] {
  const ids = new Set(categories.map((category) => category.id));
  const childrenByParent = new Map<string | null, CollectionSummary[]>();

  for (const category of categories) {
    const parentId = category.parent?.id;
    const key = parentId && ids.has(parentId) ? parentId : null;
    const siblings = childrenByParent.get(key) ?? [];
    siblings.push(category);
    childrenByParent.set(key, siblings);
  }

  const visited = new Set<string>();
  const build = (parentId: string | null): CategoryTreeNode[] =>
    (childrenByParent.get(parentId) ?? [])
      .toSorted(compareCategories)
      .flatMap((category) => {
        if (visited.has(category.id)) return [];
        visited.add(category.id);
        return [
          {
            category,
            children: build(category.id),
          },
        ];
      });

  const roots = build(null);

  // Defensive fallback for malformed/cyclic provider data.
  for (const category of categories.toSorted(compareCategories)) {
    if (visited.has(category.id)) continue;
    visited.add(category.id);
    roots.push({ category, children: [] });
  }

  return roots;
}

export function directChildCategories(
  categories: CollectionSummary[],
  parentId: string,
): CollectionSummary[] {
  return categories
    .filter((category) => category.parent?.id === parentId)
    .toSorted(compareCategories);
}
