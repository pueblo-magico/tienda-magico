"use client";

import { Slider } from "@pueblo-magico/react-ui";
import { useState } from "react";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function SliderPage() {
  const [range, setRange] = useState<readonly [number, number]>([25, 75]);

  return (
    <>
      <DocsPageHeader
        title="Slider"
        description="Control compartido de @pueblo-magico/react-ui para valores simples y rangos controlados, con teclado, foco visible y salida localizada."
      />
      <DocsSection title="Rango" className="w-full max-w-md">
        <Slider
          formatValue={([minimum, maximum]) =>
            `${minimum.toLocaleString("es-AR")} – ${maximum.toLocaleString("es-AR")}`
          }
          label="Rango de precios"
          minValue={0}
          maxValue={100}
          mode="range"
          onChange={setRange}
          thumbLabels={["Precio mínimo", "Precio máximo"]}
          value={range}
        />
      </DocsSection>
    </>
  );
}
