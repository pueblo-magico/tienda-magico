import {
  HeartIcon,
  LeafIcon,
  MountainsIcon,
  SunIcon,
  WavesIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { CategoryIcon as CategoryIconName } from "@/types/commerce";

const icons = {
  leaf: LeafIcon,
  mountain: MountainsIcon,
  sun: SunIcon,
  ritual: WavesIcon,
  heart: HeartIcon,
} as const;

export function CategoryIcon({ name }: { name: CategoryIconName }) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" className="size-8" weight="thin" />;
}
