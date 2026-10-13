"use client";

import { Button } from "@pueblo-magico/react-ui";
import { ClipboardList, Package2, ShoppingCart } from "lucide-react";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { IconAction } from "@/components/ui/IconAction";

export default function ButtonPage() {
  return (
    <>
      <DocsPageHeader
        title="Button"
        description="Acciones canónicas de react-ui 0.2.0. La navegación conserva el enlace de Next.js mediante ButtonLink, que aplica los estilos publicados por la biblioteca."
      />
      <DocsSection
        title="Variantes semánticas"
        description="Primary para la acción principal; secondary y ghost para acciones de menor jerarquía; accent para énfasis y danger para operaciones destructivas."
      >
        <Button>Comprar</Button>
        <Button variant="secondary">Conocer más</Button>
        <Button variant="ghost">Ver detalles</Button>
        <Button variant="accent">Destacar</Button>
        <Button variant="danger">Eliminar</Button>
        <ButtonLink href="/ui-system" variant="ghost">
          Volver al sistema
        </ButtonLink>
      </DocsSection>
      <DocsSection title="Tamaños">
        <Button size="sm">Agregar</Button>
        <Button size="md">Agregar</Button>
        <Button size="lg">Agregar</Button>
        <Button size="icon" shape="rounded" aria-label="Agregar al carrito">
          <ShoppingCart aria-hidden className="size-4" strokeWidth={2} />
        </Button>
      </DocsSection>
      <DocsSection title="IconAction · patrón propio de Tienda">
        <div className="border-border flex w-full flex-wrap justify-center gap-8 border-t pt-6">
          <IconAction
            icon={<ClipboardList className="size-6" strokeWidth={1.5} />}
          >
            Consultar estado
          </IconAction>
          <IconAction
            href="/es/mis-pedidos"
            icon={<Package2 className="size-6" strokeWidth={1.5} />}
          >
            Mis pedidos
          </IconAction>
          <IconAction
            isDisabled
            loading
            icon={<ClipboardList className="size-6" strokeWidth={1.5} />}
          >
            Consultar estado
          </IconAction>
        </div>
      </DocsSection>
      <DocsSection title="Estados">
        <Button isDisabled>Agotado</Button>
        <Button variant="secondary" isDisabled>
          No disponible
        </Button>
        <Button isLoading>Guardando</Button>
      </DocsSection>
    </>
  );
}
