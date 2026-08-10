import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <main className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand/60">
            Pueblo Magico
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-brand sm:text-4xl">
            Mountain shop
          </h1>
          <p className="text-sm text-brand/70">
            Conscious products inspired by the mountains.
          </p>
        </div>

        <Link
          href="/ui-system"
          className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-medium uppercase tracking-[0.1em] text-brand-foreground transition-colors hover:bg-brand-hover"
        >
          Open design system
        </Link>
      </main>
    </div>
  );
}
