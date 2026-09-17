import { Button } from "@/components/ui/Button";
import { IconAction } from "@/components/ui/IconAction";
import { ClipboardList, Package2 } from "lucide-react";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";
import { ShoppingCart } from "lucide-react";

export default function ButtonPage() {
  return (
    <>
      <DocsPageHeader
        title="Button"
        description="Pill-shaped actions matching the shop CTAs. Supports primary, secondary, ghost, and link variants, plus optional href rendering."
      />

      <DocsSection
        title="Variants"
        description="Primary for commerce CTAs; secondary/ghost for quieter actions; link for inline navigation."
      >
        <Button>Shop collection</Button>
        <Button variant="secondary">Learn more</Button>
        <Button variant="ghost">View details</Button>
        <Button variant="link" href="/ui-system">
          Design system
        </Button>
      </DocsSection>

      <DocsSection
        title="Acento terracota"
        description="color elige la paleta; variant define el estilo. Conserva foco, deshabilitado, hover y active. Forest sigue siendo el color predeterminado."
      >
        <Button color="terracotta">Continuar</Button>
        <Button color="terracotta" href="/ui-system/tokens">
          Ver paleta
        </Button>
        <Button color="terracotta" disabled>
          No disponible
        </Button>
      </DocsSection>
      <DocsSection
        title="Texto sin transformar"
        description="textCase=sentence conserva el texto original sin forzar mayúsculas."
      >
        <Button textCase="sentence">Pagar</Button>
        <Button textCase="sentence" variant="secondary">
          Seguir comprando
        </Button>
      </DocsSection>

      <DocsSection
        title="Peso liviano"
        description="Button usa la base React Aria de shadcn. weight=light aplica Jost 300, combinable con cualquier color; el peso predeterminado sigue siendo 700. Los enlaces conservan su semántica de navegación."
      >
        <Button weight="light">Continuar</Button>
        <Button weight="light" variant="secondary">
          Ver detalles
        </Button>
        <Button weight="light" color="terracotta">
          Explorar
        </Button>
        <Button weight="light" disabled>
          No disponible
        </Button>
        <Button weight="light" variant="link" href="/ui-system/tokens">
          Ver colores
        </Button>
      </DocsSection>

      <DocsSection
        title="Colores de la paleta"
        description="Los tonos claros usan texto oscuro en botones sólidos. Para secondary, ghost y link claros, usá un fondo oscuro que asegure contraste."
      >
        {(
          [
            "forest",
            "terracotta",
            "gold",
            "earth",
            "gray",
            "black",
            "white",
            "cream",
            "warm",
          ] as const
        ).map((color) => (
          <div
            key={color}
            className={`flex flex-wrap gap-3 rounded-lg p-4 ${["gold", "white", "cream", "warm"].includes(color) ? "bg-background-secondary" : "bg-card"}`}
          >
            <Button color={color}>{color}</Button>
            <Button color={color} variant="secondary">
              Contorno
            </Button>
            <Button color={color} variant="ghost">
              Discreto
            </Button>
          </div>
        ))}
      </DocsSection>

      <DocsSection title="Sizes">
        <Button size="sm">Add to cart</Button>
        <Button size="md">Add to cart</Button>
        <Button size="lg">Add to cart</Button>
        <Button size="icon-sm" shape="rounded" aria-label="Quick add to cart">
          <ShoppingCart aria-hidden className="size-4" strokeWidth={2} />
        </Button>
      </DocsSection>
      <DocsSection title="IconAction · ícono circular con etiqueta">
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
            disabled
            loading
            icon={<ClipboardList className="size-6" strokeWidth={1.5} />}
          >
            Consultar estado
          </IconAction>
        </div>
      </DocsSection>

      <DocsSection title="States">
        <Button disabled>Sold out</Button>
        <Button variant="secondary" disabled>
          Unavailable
        </Button>
      </DocsSection>

      <DocsSection
        title="Selection and cursor"
        description="Selected options reuse primary colors, including hover and active states; unselected options use secondary. Enabled buttons show a pointer cursor; disabled buttons do not."
      >
        <Button aria-pressed={true}>20g — selected</Button>
        <Button variant="secondary" aria-pressed={false}>
          15g
        </Button>
        <Button disabled aria-pressed={false}>
          Unavailable option
        </Button>
      </DocsSection>
    </>
  );
}
