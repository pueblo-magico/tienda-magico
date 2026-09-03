import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

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
        className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4"
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

      <DocsSection title="Typography" className="flex-col items-start gap-3">
        <p className="text-text-secondary font-serif text-4xl">Georgia</p>
        <p className="text-text-primary font-sans text-base">
          Inter for body copy and general UI labels.
        </p>
      </DocsSection>
    </>
  );
}
