import type { CategoryIcon as CategoryIconName } from "@/types/commerce";

const glyphs: Record<CategoryIconName, string> = {
  leaf: "M12 21C8 17 5 13 6 7c6 0 10 3 10 8-1 2-2 4-4 6M6 7c2 4 4 7 7 9",
  mountain: "m3 19 6-9 3 4 2-3 7 8H3Zm6-9 2-3 2 3",
  sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  ritual: "M12 3c-3 3-5 5-5 8a5 5 0 0 0 10 0c0-3-2-5-5-8Zm-7 15 14-6M5 12l14 6",
  heart: "M20.8 8.6c0 5.4-8.8 10.4-8.8 10.4S3.2 14 3.2 8.6A4.6 4.6 0 0 1 12 6.2a4.6 4.6 0 0 1 8.8 2.4Z",
};

export function CategoryIcon({ name }: { name: CategoryIconName }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={glyphs[name]} /></svg>;
}
