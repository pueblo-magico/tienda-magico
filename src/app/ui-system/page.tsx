import Link from "next/link";

const components = [
  {
    href: "/ui-system/button",
    name: "Button",
    description:
      "Forest-green pill CTAs used for shop actions like Shop collection and Add to cart.",
  },
];

export default function UiSystemPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand/50">
          Design system
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-brand">
          Components
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-brand/70">
          Living reference for Pueblo Magico UI primitives. Browse each component
          to review variants, sizes, and usage aligned with the shop design.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {components.map((component) => (
          <li key={component.href}>
            <Link
              href={component.href}
              className="block rounded-2xl border border-border bg-white/40 p-5 transition-colors hover:border-brand/30 hover:bg-white/70"
            >
              <h2 className="text-lg font-medium text-brand">{component.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand/65">
                {component.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}