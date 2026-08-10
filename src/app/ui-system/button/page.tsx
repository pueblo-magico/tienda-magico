import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-white/40 p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-medium text-brand">{title}</h2>
        <p className="text-sm text-brand/65">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </section>
  );
}

export default function ButtonPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand/50">
          Components
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-brand">
          Button
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-brand/70">
          Primary call-to-action control from the shop design. Rounded full
          (pill), uppercase label, and deep forest-green fill for key commerce
          actions.
        </p>
      </div>

      <Section
        title="Variants"
        description="Primary for main CTAs, secondary for quieter actions, ghost for low-emphasis controls."
      >
        <Button>Shop collection</Button>
        <Button variant="secondary">Learn more</Button>
        <Button variant="ghost">View details</Button>
      </Section>

      <Section
        title="Sizes"
        description="Use sm for dense UI, md as the default, and lg for hero-level actions."
      >
        <Button size="sm">Add to cart</Button>
        <Button size="md">Add to cart</Button>
        <Button size="lg">Add to cart</Button>
      </Section>

      <Section
        title="States"
        description="Disabled buttons stay visible but are non-interactive."
      >
        <Button disabled>Sold out</Button>
        <Button variant="secondary" disabled>
          Unavailable
        </Button>
      </Section>

      <section className="space-y-3 rounded-2xl border border-border bg-white/40 p-6">
        <h2 className="text-lg font-medium text-brand">Usage</h2>
        <pre className="overflow-x-auto rounded-xl bg-brand px-4 py-3 text-left text-xs leading-relaxed text-brand-foreground">
          <code>{`import { Button } from "@/components/ui/Button";

<Button>Shop collection</Button>
<Button variant="secondary">Learn more</Button>
<Button size="sm">Add to cart</Button>`}</code>
        </pre>
      </section>
    </div>
  );
}