import {
  ArrowRightIcon,
  HeartIcon,
  LeafIcon,
  LockKeyIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  MountainsIcon,
  PlantIcon,
  PlusIcon,
  ShoppingBagIcon,
  SlidersHorizontalIcon,
  SunIcon,
  TruckIcon,
  WavesIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

const catalogIcons = [
  { name: "LeafIcon", Icon: LeafIcon },
  { name: "MountainsIcon", Icon: MountainsIcon },
  { name: "SunIcon", Icon: SunIcon },
  { name: "WavesIcon", Icon: WavesIcon },
  { name: "HeartIcon", Icon: HeartIcon },
];

const interfaceIcons = [
  { name: "ShoppingBagIcon", Icon: ShoppingBagIcon },
  { name: "MagnifyingGlassIcon", Icon: MagnifyingGlassIcon },
  { name: "SlidersHorizontalIcon", Icon: SlidersHorizontalIcon },
  { name: "ArrowRightIcon", Icon: ArrowRightIcon },
  { name: "PlusIcon", Icon: PlusIcon },
  { name: "MinusIcon", Icon: MinusIcon },
];

const benefitIcons = [
  { name: "TruckIcon", label: "Envíos", Icon: TruckIcon },
  { name: "LockKeyIcon", label: "Pago seguro", Icon: LockKeyIcon },
  { name: "PlantIcon", label: "Origen responsable", Icon: PlantIcon },
];

function IconGrid({ items }: { items: typeof catalogIcons }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(({ name, Icon }) => (
        <li
          key={name}
          className="border-border bg-card text-text-secondary flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl border p-4"
        >
          <Icon aria-hidden className="size-8" weight="light" />
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
        description="Phosphor Icons es la única biblioteca de iconos del storefront. Los iconos heredan el color semántico del contexto."
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
                weight="light"
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

      <DocsSection title="Tamaños y pesos">
        <div className="border-border bg-card text-text-secondary flex flex-wrap items-end gap-8 rounded-xl border p-5">
          {[16, 20, 24, 32, 40].map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <LeafIcon aria-hidden size={size} weight="light" />
              <code className="text-text-primary text-xs">{size}px</code>
            </div>
          ))}
        </div>
        <p className="text-text-primary mt-3 text-sm">
          Usá el peso <code>light</code> para información y decoración, y el
          peso <code>regular</code> para controles interactivos. Los iconos
          decorativos llevan <code>aria-hidden</code>. Un control que muestra
          solo un icono necesita un nombre accesible en el botón o enlace.
        </p>
      </DocsSection>
    </>
  );
}
