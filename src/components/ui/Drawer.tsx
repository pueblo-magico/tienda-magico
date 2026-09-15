"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Optional footer rendered after the body inside the drawer scroll area. */
  footer?: ReactNode;
  side?: "left" | "right";
  className?: string;
  /** Stable id for the title heading (avoids useId hydration issues when set). */
  titleId?: string;
};

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = "right",
  className,
  titleId: titleIdProp,
}: DrawerProps) {
  const generatedTitleId = useId();
  const titleId = titleIdProp ?? generatedTitleId;
  // Overlays should not SSR: useId / portal trees often mismatch with the client.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        "transition-visibility fixed inset-0 z-50",
        open ? "visible" : "pointer-events-none invisible",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close drawer"
        tabIndex={open ? 0 : -1}
        className={cn(
          "bg-forest/40 absolute inset-0 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "bg-cream absolute top-0 flex h-full w-full max-w-md flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-out",
          side === "right" ? "right-0" : "left-0",
          open
            ? "translate-x-0"
            : side === "right"
              ? "translate-x-full"
              : "-translate-x-full",
          className,
        )}
      >
        <div className="border-border flex shrink-0 items-center justify-between border-b px-5 py-4">
          <h2 id={titleId} className="font-serif text-xl font-normal">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-forest/70 hover:bg-forest/5 hover:text-forest rounded-full px-2 py-1 text-sm transition-colors"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-5 py-4">{children}</div>
          {footer ? (
            <div className="border-border border-t px-5 py-4">{footer}</div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
