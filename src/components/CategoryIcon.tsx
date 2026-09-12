import { Heart, Leaf, Mountain, Sun, Waves } from "lucide-react";
import type { CategoryIcon as CategoryIconName } from "@/types/commerce";

const icons = { leaf: Leaf, mountain: Mountain, sun: Sun, ritual: Waves, heart: Heart } as const;

export function CategoryIcon({ name }: { name: CategoryIconName }) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" className="size-8" strokeWidth={1} />;
}
