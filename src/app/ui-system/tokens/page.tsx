import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";
import { Button } from "@/components/ui/Button";

const backgrounds = [
  {
    name: "Primary background",
    swatch: "bg-background-primary border border-border",
    value: "#FAFAF9",
  },
  {
    name: "Secondary background",
    swatch: "bg-background-secondary",
    value: "#005333",
  },
  {
    name: "Card",
    swatch: "bg-card border border-border",
    value: "#FFFFFF",
  },
  {
    name: "Card hover",
    swatch: "bg-card-hover border border-border",
    value: "#FAFAF9",
  },
  {
    name: "Warm surface",
    swatch: "bg-warm border border-border",
    value: "#F3EEE5",
  },
];

const textColors = [
  { name: "Black", swatch: "bg-text-black", value: "#111827" },
  { name: "Primary", swatch: "bg-text-primary", value: "#6B7280" },
  { name: "Secondary", swatch: "bg-text-secondary", value: "#005333" },
  { name: "Highlight", swatch: "bg-text-highlight", value: "#D4AF37" },
  { name: "Accent", swatch: "bg-text-accent", value: "#8B6914" },
];

export default function TokensPage() {
  return (
    <>
      <DocsPageHeader
        eyebrow="Foundation"
        title="Design tokens"
        description="Canonical Pueblo Mágico color and typography tokens used throughout the storefront."
      />

      <DocsSection
        title="Background colors"
        description="Primary page surfaces, deep-green sections, and white cards with warm off-white hover states."
        className="grid w-full grid-cols-2 gap-4 sm:grid-cols-5"
      >
        {backgrounds.map((color) => (
          <div key={color.name} className="space-y-2">
            <div className={`h-20 rounded-2xl ${color.swatch}`} />
            <p className="text-text-black text-sm font-medium">{color.name}</p>
            <p className="text-text-primary text-xs">{color.value}</p>
          </div>
        ))}
      </DocsSection>

      <DocsSection
        title="Text colors"
        description="Black for navigation and strong copy, gray for body copy, green for brand hierarchy, and gold tones for emphasis."
        className="grid w-full grid-cols-2 gap-4 sm:grid-cols-5"
      >
        {textColors.map((color) => (
          <div key={color.name} className="space-y-2">
            <div className={`h-20 rounded-2xl ${color.swatch}`} />
            <p className="text-text-black text-sm font-medium">{color.name}</p>
            <p className="text-text-primary text-xs">{color.value}</p>
          </div>
        ))}
      </DocsSection>

      <DocsSection
        title="Paleta adicional · Terracota"
        description="Color adicional, sin reemplazar los colores existentes ni asignarle un estado semántico. Su valor se define únicamente en --terracotta."
        className="grid w-full gap-4 sm:grid-cols-3"
      >
        <div className="space-y-2">
          <div className="bg-terracotta text-brand-foreground flex h-20 items-center justify-center rounded-2xl">
            Terracota
          </div>
          <code className="text-text-primary text-xs">bg-terracotta</code>
        </div>
        <div className="space-y-2">
          <div className="text-terracotta bg-card flex h-20 items-center justify-center rounded-2xl">
            Texto terracota
          </div>
          <code className="text-text-primary text-xs">text-terracotta</code>
        </div>
        <div className="space-y-2">
          <div className="border-terracotta text-text-black flex h-20 items-center justify-center rounded-2xl border">
            Borde terracota
          </div>
          <code className="text-text-primary text-xs">border-terracotta</code>
        </div>
      </DocsSection>

      <DocsSection title="Botón terracota">
        <Button color="terracotta">Continuar</Button>
        <code className="text-text-primary text-xs">
          {'<Button color="terracotta">'}
        </code>
      </DocsSection>

      <DocsSection title="Typography" className="flex-col items-start gap-3">
        <p className="text-text-secondary font-serif text-4xl font-normal">
          Georgia Regular 400 for editorial titles.
        </p>
        <p className="text-text-primary font-sans text-base font-light">
          Jost Light 300 for body copy and general UI labels.
        </p>
        <p className="text-text-black font-sans text-base font-bold">
          Jost Bold 700 for sans-serif titles and buttons.
        </p>
      </DocsSection>
    </>
  );
}
