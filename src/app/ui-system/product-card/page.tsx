import { ProductCard } from "@/components/cards";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function ProductCardPage() {
  return (
    <>
      <DocsPageHeader
        title="ProductCard"
        description="Product teaser used in collections and best-seller grids."
      />
      <DocsSection title="Example" className="w-full max-w-xs">
        <ProductCard
          href="/en/shop/organic-mountain-cacao"
          title="Organic Mountain Cacao"
          price="$28"
          badge="Best seller"
          category="Wellness rituals"
          imageLoading="eager"
          imageSrc="https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=800&q=80"
        />
      </DocsSection>
    </>
  );
}
