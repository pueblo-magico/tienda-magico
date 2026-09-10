import Link from "next/link";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";

const components = [
  {
    href: "/ui-system/example",
    name: "Usage example",
    description:
      "A composed page showing how components and semantic tokens work together.",
  },
  {
    href: "/ui-system/tokens",
    name: "Tokens",
    description: "Semantic Pueblo Mágico color and typography foundations.",
  },
  {
    href: "/ui-system/button",
    name: "Button",
    description: "Primary commerce CTAs and quieter actions.",
  },
  {
    href: "/ui-system/icons",
    name: "Iconos",
    description: "Iconografía Lucide, tamaños, trazos y uso accesible.",
  },
  {
    href: "/ui-system/typography",
    name: "Typography",
    description: "PageTitle, SectionTitle, Eyebrow, Body, Caption.",
  },
  {
    href: "/ui-system/badge",
    name: "Badge",
    description: "Compact status and category labels.",
  },
  {
    href: "/ui-system/input",
    name: "Input",
    description: "Text fields with labels and validation states.",
  },
  {
    href: "/ui-system/select",
    name: "Select",
    description: "Native select styled to the brand.",
  },
  {
    href: "/ui-system/textarea",
    name: "Textarea",
    description: "Multi-line form input.",
  },
  {
    href: "/ui-system/modal",
    name: "Modal",
    description: "Accessible dialog overlays.",
  },
  {
    href: "/ui-system/drawer",
    name: "Drawer",
    description: "Slide-over panels for cart and menus.",
  },
  {
    href: "/ui-system/accordion",
    name: "Accordion",
    description: "Expandable FAQ-style content.",
  },
  {
    href: "/ui-system/tabs",
    name: "Tabs",
    description: "Tabbed content switching.",
  },
  {
    href: "/ui-system/product-card",
    name: "ProductCard",
    description: "Commerce product teaser card.",
  },
  {
    href: "/ui-system/article-card",
    name: "ArticleCard",
    description: "Journal article teaser.",
  },
  {
    href: "/ui-system/impact-card",
    name: "ImpactCard",
    description: "Impact statistics card.",
  },
  {
    href: "/ui-system/container",
    name: "Container",
    description: "Responsive content width wrapper.",
  },
  {
    href: "/ui-system/section",
    name: "Section",
    description: "Vertical rhythm and section tones.",
  },
];

export default function UiSystemPage() {
  return (
    <>
      <DocsPageHeader
        eyebrow="Design system"
        title="Pueblo Mágico UI"
        description="Living reference for layout, typography, forms, and commerce components used across the multilingual shop."
      />

      <ul className="grid gap-4 sm:grid-cols-2">
        {components.map((component) => (
          <li key={component.href}>
            <Link
              href={component.href}
              className="border-border bg-card/70 hover:border-forest/30 hover:bg-card block rounded-2xl border p-5 transition-colors"
            >
              <h2 className="text-forest font-medium">{component.name}</h2>
              <p className="text-forest/65 mt-2 text-sm leading-relaxed">
                {component.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
