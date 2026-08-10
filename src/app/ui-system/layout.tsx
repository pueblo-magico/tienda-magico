import Link from "next/link";
import type { ReactNode } from "react";
import { UiSystemNav } from "@/components/ui-system/UiSystemNav";

export default function UiSystemLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-forest text-brand-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/en"
              className="font-serif text-lg tracking-[0.06em] text-brand-foreground/90 transition-colors hover:text-brand-foreground"
            >
              Pueblo Mágico
            </Link>
            <span className="hidden h-4 w-px bg-brand-foreground/20 sm:block" />
            <Link
              href="/ui-system"
              className="text-sm font-medium tracking-wide text-brand-foreground"
            >
              Design System
            </Link>
          </div>
          <Link
            href="/en"
            className="text-xs uppercase tracking-[0.12em] text-brand-foreground/70 transition-colors hover:text-brand-foreground"
          >
            Back to shop
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:self-start lg:overflow-y-auto">
          <UiSystemNav />
        </aside>
        <main className="min-w-0 space-y-8">{children}</main>
      </div>
    </div>
  );
}
