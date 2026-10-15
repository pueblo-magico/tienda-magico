"use client";

import { useState } from "react";
import { Rating, RatingInput } from "@pueblo-magico/react-ui";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function RatingPage() {
  const [value, setValue] = useState<number | null>(null);
  return (
    <>
      <DocsPageHeader
        title="Rating"
        description="Lectura y captura accesible de puntuaciones mediante @pueblo-magico/react-ui, con nombres localizados y una opción explícita para limpiar la selección."
      />
      <DocsSection title="Lectura">
        <Rating value={4} label="4 de 5 estrellas" reviewCount="24" />
      </DocsSection>
      <DocsSection title="Selección">
        <RatingInput
          value={value}
          onChange={setValue}
          label="Experiencia de compra"
          clearLabel="Sin puntuación"
          valueLabel={(rating) => `${rating} de 5 estrellas`}
        />
      </DocsSection>
    </>
  );
}
