"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={cn(
        "border-border bg-cream text-forest fixed inset-0 m-auto w-[min(100%-2rem,32rem)] rounded-2xl border p-0 shadow-2xl open:flex open:flex-col",
        "backdrop:bg-forest/40 backdrop:backdrop-blur-[2px]",
        className,
      )}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="border-border flex items-start justify-between gap-4 border-b px-5 py-4">
        <h2 id={titleId} className="font-serif text-xl font-normal">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-forest/70 hover:bg-forest/5 hover:text-forest rounded-full px-2 py-1 text-sm transition-colors"
          aria-label="Close dialog"
        >
          ✕
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
