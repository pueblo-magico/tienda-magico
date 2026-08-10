import Link from "next/link";
import type { ReactNode } from "react";
import { UiSystemNav } from "@/components/ui-system/UiSystemNav";

export default function UiSystemLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-brand text-brand-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xs font-medium uppercase tracking-[0.18em] text-brand-foreground/70 transition-colors hover:text-brand-foreground"
            >
              Pueblo Magico
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
            href="/"
            className="text-xs uppercase tracking-[0.12em] text-brand-foreground/70 transition-colors hover:text-brand-foreground"
          >
            Back to shop
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-brand/50">
            Components
          </p>
          <UiSystemNav />
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}