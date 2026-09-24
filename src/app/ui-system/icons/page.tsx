import {
  ArrowRight,
  Heart,
  Leaf,
  LockKeyhole,
  Minus,
  Mountain,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sprout,
  Sun,
  Truck,
  UserRound,
  Waves,
} from "lucide-react";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

const catalogIcons = [
  { name: "Leaf", Icon: Leaf },
  { name: "Mountain", Icon: Mountain },
  { name: "Sun", Icon: Sun },
  { name: "Waves", Icon: Waves },
  { name: "Heart", Icon: Heart },
];

const interfaceIcons = [
  { name: "UserRound", Icon: UserRound },
  { name: "ShoppingBag", Icon: ShoppingBag },
  { name: "Search", Icon: Search },
  { name: "SlidersHorizontal", Icon: SlidersHorizontal },
  { name: "ArrowRight", Icon: ArrowRight },
  { name: "Plus", Icon: Plus },
  { name: "Minus", Icon: Minus },
];

const benefitIcons = [
  { name: "Truck", label: "Envíos", Icon: Truck },
  { name: "LockKeyhole", label: "Pago seguro", Icon: LockKeyhole },
  { name: "Sprout", label: "Origen responsable", Icon: Sprout },
];

function IconGrid({ items }: { items: typeof catalogIcons }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(({ name, Icon }) => (
        <li
          key={name}
          className="border-border bg-card text-text-secondary flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl border p-4"
        >
          <Icon aria-hidden className="size-8" strokeWidth={1.5} />
          <code className="text-text-primary text-xs">{name}</code>
        </li>
      ))}
    </ul>
  );
}

export default function IconsPage() {
  return (
    <>
      <DocsPageHeader
        eyebrow="Sistema de diseño"
        title="Iconos"
        description="Lucide React es la única biblioteca de iconos del storefront. Los iconos heredan el color semántico del contexto."
      />

      <DocsSection title="Categorías y contenido">
        <IconGrid items={catalogIcons} />
      </DocsSection>

      <DocsSection title="Interfaz">
        <IconGrid items={interfaceIcons} />
      </DocsSection>

      <DocsSection title="Beneficios de compra">
        <ul className="grid gap-3 sm:grid-cols-3">
          {benefitIcons.map(({ name, label, Icon }) => (
            <li
              key={name}
              className="border-border bg-card text-text-primary flex items-center gap-3 rounded-xl border p-4"
            >
              <Icon
                aria-hidden
                className="text-text-secondary size-5"
                strokeWidth={1.5}
              />
              <span>
                <strong className="text-text-black block font-bold">
                  {label}
                </strong>
                <code className="text-xs">{name}</code>
              </span>
            </li>
          ))}
        </ul>
      </DocsSection>

      <DocsSection title="Tamaños y trazos">
        <div className="border-border bg-card text-text-secondary flex flex-wrap items-end gap-8 rounded-xl border p-5">
          {[16, 20, 24, 32, 40].map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Leaf aria-hidden size={size} strokeWidth={1.5} />
              <code className="text-text-primary text-xs">{size}px</code>
            </div>
          ))}
        </div>
        <p className="text-text-primary mt-3 text-sm">
          Usá trazo 1.5 para información y decoración; trazo 2 para controles
          interactivos. Los iconos decorativos llevan <code>aria-hidden</code>.
          Un control que muestra solo un icono necesita un nombre accesible en
          el botón o enlace.
        </p>
      </DocsSection>
    </>
  );
}
