import type { ReactNode } from "react";
import { Banknote, ShieldCheck } from "lucide-react";
import { Body, PageTitle } from "@/components/typography";

export function CashWaiting({
  title,
  body,
  notice,
  children,
}: {
  title: string;
  body: string;
  notice: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Banknote
          aria-hidden
          className="text-text-accent mt-1 size-10 shrink-0"
          strokeWidth={1.5}
        />
        <div className="space-y-2">
          <PageTitle as="h1" className="text-4xl sm:text-5xl">
            {title}
          </PageTitle>
          <Body className="text-text-primary">{body}</Body>
        </div>
      </div>
      <dl className="border-border bg-card space-y-3 rounded-2xl border p-5">
        {children}
      </dl>
      <p className="bg-warm text-text-secondary flex gap-3 rounded-xl p-4 text-sm">
        <ShieldCheck
          aria-hidden
          className="size-5 shrink-0"
          strokeWidth={1.5}
        />
        <span>{notice}</span>
      </p>
    </div>
  );
}
