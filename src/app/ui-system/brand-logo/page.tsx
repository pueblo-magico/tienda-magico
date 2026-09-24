import { BrandLogo } from "@/components/layout/BrandLogo";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function BrandLogoPage() {
  return (
    <>
      <DocsPageHeader
        title="Logo de marca"
        description="Identidad compartida del encabezado y del menú móvil. Si la imagen del CMS no carga, se muestra el logo local."
      />
      <DocsSection title="Respaldo local">
        <BrandLogo />
      </DocsSection>
      <DocsSection title="Imagen configurada">
        <BrandLogo
          name="Pueblo Mágico"
          logo={{
            url: "/pueblo_magico_logo_marron.svg",
            altText: "Pueblo Mágico",
            width: 134,
            height: 65,
          }}
        />
      </DocsSection>
    </>
  );
}
