import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

const colors = [
  { name: "Forest", swatch: "bg-forest", value: "#2C3327" },
  { name: "Earth", swatch: "bg-earth", value: "#6B5744" },
  { name: "Sand", swatch: "bg-sand", value: "#D4CEC3" },
  { name: "Cream", swatch: "bg-cream border border-border", value: "#EFECE6" },
  { name: "Clay", swatch: "bg-clay", value: "#A67C5D" },
];

export default function TokensPage() {
  return (
    <>
      <DocsPageHeader
        eyebrow="Foundation"
        title="Design tokens"
        description="Brand palette and type pairings extracted from the shop design: deep forest chrome on warm cream surfaces."
      />

      <DocsSection title="Color" className="grid w-full grid-cols-2 gap-4 sm:grid-cols-5">
        {colors.map((color) => (
          <div key={color.name} className="space-y-2">
            <div className={`h-20 rounded-2xl ${color.swatch}`} />
            <p className="text-sm font-medium text-forest">{color.name}</p>
            <p className="text-xs text-forest/55">{color.value}</p>
          </div>
        ))}
      </DocsSection>

      <DocsSection title="Typography" className="flex-col items-start gap-3">
        <p className="font-serif text-4xl text-forest">Cormorant Garamond</p>
        <p className="font-sans text-base text-forest/75">
          Inter for body copy, UI labels, and navigation.
        </p>
      </DocsSection>
    </>
  );
}
