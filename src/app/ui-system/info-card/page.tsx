import { InfoCard } from "@/components/cards";
import { Droplet } from "lucide-react";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function InfoCardPage() {
  return (
    <>
      <DocsPageHeader
        title="InfoCard"
        description="Tarjeta informativa para explicar atributos, principios y lineamientos."
      />
      <DocsSection
        title="Superficie predeterminada"
        className="w-full max-w-md"
      >
        <InfoCard
          eyebrow="01"
          title="Elegí colores por significado"
          description="Usá los tokens semánticos para mantener una jerarquía consistente."
        />
      </DocsSection>
      <DocsSection
        title="Superficie inversa"
        className="bg-brand w-full rounded-2xl p-6"
      >
        <InfoCard
          tone="inverse"
          eyebrow="Origen"
          title="Producción local"
          description="Relaciones directas con personas creadoras de la región."
          className="max-w-md"
        />
      </DocsSection>
      <DocsSection
        title="Contenido centrado"
        className="bg-brand w-full rounded-2xl p-6"
      >
        <InfoCard
          variant="centered"
          tone="inverse"
          icon={<Droplet aria-hidden className="size-8" strokeWidth={1.5} />}
          title="Biokit ecológico"
          description="Jabón, shampoo y acondicionador biodegradables"
          className="max-w-lg"
        />
      </DocsSection>
      <DocsSection
        title="Jerarquía prominente"
        className="bg-brand w-full rounded-2xl p-6"
      >
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <InfoCard
            variant="prominent"
            tone="inverse"
            eyebrow="Habitación o domo compartido"
            title="$50.000 / persona / noche"
            description="Pensión completa, precio por persona"
          />
          <InfoCard
            variant="prominent"
            tone="accent"
            eyebrow="Domo privado"
            title="$150.000 / noche"
            description="1 o 2 personas, domo entero"
          />
        </div>
      </DocsSection>
      <DocsSection title="Testimonio" className="w-full max-w-2xl">
        <InfoCard
          variant="testimonial"
          tone="muted"
          eyebrow="Julieta Castoldi"
          title="“Lo más importante: el amor, la entrega de todo el equipo y la capacidad de sentirte uno con la naturaleza.”"
          description="Facilitadora"
          icon={
            <span className="bg-background-primary block size-20 rounded-full" />
          }
        />
      </DocsSection>
    </>
  );
}
