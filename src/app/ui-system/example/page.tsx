import { ImpactCard, InfoCard } from "@/components/cards";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import {
  Body,
  Eyebrow,
  PageTitle,
  SectionTitle,
} from "@/components/typography";
import { Badge, Button, Input, Select, Textarea } from "@/components/ui";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

const interests = [
  { label: "Productos artesanales", value: "products" },
  { label: "Experiencias", value: "experiences" },
  { label: "Estadías", value: "stays" },
];

const patternNotes = [
  {
    title: "Choose colors by meaning",
    body: "Use background tokens for page and section surfaces, text tokens for hierarchy, and card tokens only for card surfaces and their hover state.",
  },
  {
    title: "Compose shared components",
    body: "Build sections from Container, typography, action, form, and card components before introducing page-specific equivalents.",
  },
  {
    title: "Keep overrides intentional",
    body: "Use component defaults first. Add utility overrides only when the surrounding tone changes contrast requirements, such as content on a green section.",
  },
] as const;

export default function UsageExamplePage() {
  return (
    <>
      <DocsPageHeader
        eyebrow="Foundation"
        title="Usage example"
        description="A representative storefront composition built from shared components and canonical semantic tokens."
      />

      <DocsSection
        title="Composed storefront page"
        description="This preview demonstrates hierarchy and contrast across primary, secondary, and card surfaces."
        className="overflow-hidden p-0"
      >
        <div className="bg-background-primary">
          <Section spacing="lg">
            <Container width="narrow" className="text-center">
              <Badge variant="outline">Colección de la montaña</Badge>
              <Eyebrow className="text-text-highlight mt-6">
                Pueblo Mágico
              </Eyebrow>
              <PageTitle className="text-text-secondary mt-3">
                Objetos con historia, hechos para acompañarte
              </PageTitle>
              <Body size="lg" className="mx-auto mt-5 max-w-2xl">
                Productos conscientes inspirados en la montaña, las comunidades
                locales y una forma más simple de habitar el mundo.
              </Body>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button href="#example-collection">Ver colección</Button>
                <Button href="#example-contact" variant="secondary">
                  Conocer el proyecto
                </Button>
              </div>
            </Container>
          </Section>

          <Section tone="inverse" spacing="lg">
            <Container>
              <div className="mx-auto max-w-3xl text-center">
                <Eyebrow className="text-text-highlight">
                  Nuestra forma de hacer
                </Eyebrow>
                <SectionTitle className="text-brand-foreground mt-3">
                  Cuidado que se convierte en impacto
                </SectionTitle>
                <Body className="text-brand-foreground/75 mx-auto mt-4 max-w-2xl">
                  El fondo verde identifica momentos de marca y contenido de
                  alto contraste. El dorado destaca categorías, detalles y
                  llamados importantes.
                </Body>
              </div>

              <div
                id="example-collection"
                className="mt-10 grid gap-4 sm:grid-cols-3"
              >
                <InfoCard
                  tone="inverse"
                  eyebrow="Origen"
                  title="Producción local"
                  description="Relaciones directas con personas creadoras de la región."
                />
                <InfoCard
                  tone="inverse"
                  eyebrow="Materiales"
                  title="Elecciones conscientes"
                  description="Menos desperdicio y ciclos de vida más largos."
                />
                <InfoCard
                  tone="inverse"
                  eyebrow="Propósito"
                  title="Impacto compartido"
                  description="Cada compra ayuda a sostener el ecosistema del proyecto."
                />
                 <InfoCard
                  variant="prominent"
                  tone="inverse"
                  eyebrow="Propósito"
                  title="Impacto compartido"
                  description="Cada compra ayuda a sostener el ecosistema del proyecto."
                />
              </div>
            </Container>
          </Section>

          <Section tone="muted" spacing="lg">
            <Container>
              <div className="mx-auto max-w-2xl text-center">
                <Eyebrow className="text-text-accent">
                  Resultados compartidos
                </Eyebrow>
                <SectionTitle className="mt-3">
                  Una relación que crece
                </SectionTitle>
                <Body className="mt-4">
                  ImpactCard keeps statistics consistent across landing pages
                  and CMS-driven sections.
                </Body>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <ImpactCard
                  value="12+"
                  label="Comunidades"
                  description="Vinculadas mediante relaciones responsables."
                />
                <ImpactCard
                  value="40%"
                  label="Regenerativo"
                  description="Materiales elegidos con cuidado por la tierra."
                />
                <ImpactCard
                  value="1%"
                  label="Para el planeta"
                  description="De cada compra vuelve al territorio."
                />
              </div>
            </Container>
          </Section>

          <Section id="example-contact" spacing="lg">
            <Container>
              <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
                <div>
                  <Eyebrow className="text-text-highlight">
                    Sigamos en contacto
                  </Eyebrow>
                  <SectionTitle className="mt-3">
                    Contanos qué estás buscando
                  </SectionTitle>
                  <Body className="mt-4">
                    Form controls inherit card surfaces, shared borders, focus
                    states, and semantic text colors from the design system.
                  </Body>
                </div>

                <form className="bg-card hover:bg-card-hover border-border space-y-5 rounded-2xl border p-6 transition-colors">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input name="name" label="Nombre" placeholder="Tu nombre" />
                    <Input
                      name="email"
                      type="email"
                      label="Email"
                      placeholder="nombre@ejemplo.com"
                    />
                  </div>
                  <Select
                    name="interest"
                    label="Me interesa"
                    placeholder="Elegí una opción"
                    defaultValue=""
                    options={interests}
                  />
                  <Textarea
                    name="message"
                    label="Mensaje"
                    placeholder="¿Cómo podemos ayudarte?"
                    hint="Este formulario es únicamente un ejemplo visual."
                  />
                  <Button type="button">Enviar consulta</Button>
                </form>
              </div>
            </Container>
          </Section>
        </div>
      </DocsSection>

      <DocsSection
        title="Implementation rules"
        description="Use these checks when translating a design into product UI."
      >
        <ol className="grid gap-4 sm:grid-cols-3">
          {patternNotes.map((note, index) => (
            <InfoCard
              key={note.title}
              as="li"
              eyebrow={`0${index + 1}`}
              title={note.title}
              description={note.body}
            />
          ))}
        </ol>
      </DocsSection>
    </>
  );
}
