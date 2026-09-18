import {
  Body,
  Caption,
  Eyebrow,
  PageTitle,
  SectionTitle,
} from "@/components/typography";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";
import { RichText } from "@/components/typography/RichText";
import { BackdropImage } from "@/components/layout/BackdropImage";

export default function TypographyPage() {
  return (
    <>
      <DocsPageHeader
        title="Typography"
        description="Editorial hierarchy using Georgia Regular 400 for display titles and Jost for readable body content and interface controls."
      />
      <DocsSection title="Scale" className="w-full flex-col items-start gap-5">
        <div className="space-y-2">
          <Eyebrow>Eyebrow</Eyebrow>
          <PageTitle as="h2" className="text-4xl sm:text-5xl">
            PageTitle
          </PageTitle>
          <SectionTitle>SectionTitle</SectionTitle>
          <Body>
            Body copy for product storytelling and long-form content across the
            shop experience.
          </Body>
          <Body size="sm">Body sm for denser supporting text.</Body>
          <Caption>Caption for meta information and helper text.</Caption>
          <p className="font-sans text-base font-light">
            Jost Light 300 is the standard sans-serif weight.
          </p>
          <p className="font-sans text-base font-bold">
            Jost Bold 700 is used for sans-serif titles and buttons.
          </p>
        </div>
      </DocsSection>
      <DocsSection title="Título sobre imagen o superficie oscura">
        <p>
          BackdropImage es una imagen decorativa optimizada: requiere un
          contenedor relativo y conserva su superficie de fondo si la imagen
          falla. No reemplaza fotos de contenido ni necesita texto alternativo.
        </p>
        <div className="bg-background-secondary relative isolate w-full overflow-hidden rounded-xl p-6">
          <BackdropImage
            src="/favicon.svg"
            sizes="320px"
            className="-z-10 opacity-10"
          />
          <PageTitle as="h2" tone="inverse">
            Imagen decorativa
          </PageTitle>
        </div>
        <div className="bg-background-secondary rounded-xl p-6">
          <PageTitle as="h2" tone="inverse">
            Mis pedidos
          </PageTitle>
          <Body tone="inverse">
            Usá el tono inverso en superficies oscuras sin sobrescribir colores
            con clases en conflicto.
          </Body>
        </div>
      </DocsSection>
      <DocsSection
        title="Texto enriquecido seguro"
        className="w-full flex-col items-start gap-5"
      >
        <RichText
          value={{
            root: {
              type: "root",
              children: [
                {
                  type: "heading",
                  tag: "h3",
                  children: [{ type: "text", text: "Origen y cuidado" }],
                },
                {
                  type: "paragraph",
                  children: [
                    { type: "text", text: "Hecho a mano", format: 1 },
                    { type: "text", text: " por nuestra comunidad." },
                  ],
                },
                {
                  type: "list",
                  listType: "bullet",
                  children: [
                    {
                      type: "listitem",
                      children: [
                        { type: "text", text: "Guardalo en un lugar seco." },
                      ],
                    },
                  ],
                },
              ],
            },
          }}
        />
        <RichText value={"<b>Este texto no se interpreta como HTML.</b>"} />
      </DocsSection>
    </>
  );
}
