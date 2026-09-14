import { Select } from "@/components/ui/Select";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function SelectPage() {
  return (
    <>
      <DocsPageHeader
        title="Select"
        description="Native select control styled for filters and forms."
      />
      <DocsSection title="Example" className="w-full max-w-md">
        <Select
          label="Sort by"
          name="sort"
          defaultValue="featured"
          options={[
            { label: "Featured", value: "featured" },
            { label: "Price: Low to high", value: "price-asc" },
            { label: "Price: High to low", value: "price-desc" },
          ]}
        />
      </DocsSection>
      <DocsSection title="Inline" className="w-full max-w-md">
        <Select
          label="Ordenar por"
          layout="inline"
          controlSize="compact"
          name="inline-sort"
          defaultValue="featured"
          options={[
            { label: "Más vendidos", value: "featured" },
            { label: "Precio: menor a mayor", value: "price-asc" },
          ]}
        />
      </DocsSection>
    </>
  );
}
