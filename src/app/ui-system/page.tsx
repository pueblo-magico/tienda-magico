import Link from "next/link";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";

const components = [
  { href: "/ui-system/tokens", name: "Tokens", description: "Forest, earth, sand, cream, clay and type foundations." },
  { href: "/ui-system/button", name: "Button", description: "Primary commerce CTAs and quieter actions." },
  { href: "/ui-system/typography", name: "Typography", description: "PageTitle, SectionTitle, Eyebrow, Body, Caption." },
  { href: "/ui-system/badge", name: "Badge", description: "Compact status and category labels." },
  { href: "/ui-system/input", name: "Input", description: "Text fields with labels and validation states." },
  { href: "/ui-system/select", name: "Select", description: "Native select styled to the brand." },
  { href: "/ui-system/textarea", name: "Textarea", description: "Multi-line form input." },
  { href: "/ui-system/modal", name: "Modal", description: "Accessible dialog overlays." },
  { href: "/ui-system/drawer", name: "Drawer", description: "Slide-over panels for cart and menus." },
  { href: "/ui-system/accordion", name: "Accordion", description: "Expandable FAQ-style content." },
  { href: "/ui-system/tabs", name: "Tabs", description: "Tabbed content switching." },
  { href: "/ui-system/product-card", name: "ProductCard", description: "Commerce product teaser card." },
  { href: "/ui-system/article-card", name: "ArticleCard", description: "Journal article teaser." },
  { href: "/ui-system/impact-card", name: "ImpactCard", description: "Impact statistics card." },
  { href: "/ui-system/container", name: "Container", description: "Responsive content width wrapper." },
  { href: "/ui-system/section", name: "Section", description: "Vertical rhythm and section tones." },
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
              className="block rounded-2xl border border-border bg-card/70 p-5 transition-colors hover:border-forest/30 hover:bg-card"
            >
              <h2 className="font-medium text-forest">{component.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-forest/65">
                {component.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
