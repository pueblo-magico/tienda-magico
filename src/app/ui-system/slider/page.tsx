import { Slider } from "@/components/ui/Slider";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function SliderPage() {
  return (
    <>
      <DocsPageHeader
        title="Slider"
        description="Control de rango accesible con múltiples selectores, basado en React Aria."
      />
      <DocsSection title="Rango" className="w-full max-w-md">
        <Slider
          aria-label="Rango de precios"
          defaultValue={[25, 75]}
          minValue={0}
          maxValue={100}
          thumbLabels={["Precio mínimo", "Precio máximo"]}
        />
      </DocsSection>
    </>
  );
}
