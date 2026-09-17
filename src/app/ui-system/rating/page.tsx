"use client";

import { useState } from "react";
import { Rating, RatingInput } from "@/components/ui/Rating";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function RatingPage() {
  const [value, setValue] = useState(0);
  return (
    <>
      <DocsPageHeader
        title="Rating"
        description="Lectura y captura accesible de puntuaciones entre 0 y 5 estrellas."
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
