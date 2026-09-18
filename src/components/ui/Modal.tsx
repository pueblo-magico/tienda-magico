"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "celebration";
  closeLabel?: string;
  isDismissable?: boolean;
  size?: "default" | "wide";
};

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  variant = "default",
  closeLabel = "Close dialog",
  isDismissable = true,
  size = "default",
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
      onCancel={(event) => {
        event.preventDefault();
        if (isDismissable) onClose();
      }}
      className={cn(
        "border-border bg-cream text-forest fixed inset-0 m-auto max-h-dvh rounded-2xl border p-0 shadow-2xl open:flex open:flex-col",
        size === "wide" ? "w-full max-w-2xl" : "w-[min(100%-2rem,32rem)]",
        "backdrop:bg-forest/40 backdrop:backdrop-blur-[2px]",
        className,
      )}
      onClick={(event) => {
        if (isDismissable && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={
          variant === "celebration"
            ? "flex justify-end px-4 pt-4"
            : "border-border flex items-start justify-between gap-4 border-b px-5 py-4"
        }
      >
        <h2
          id={titleId}
          className={
            variant === "celebration"
              ? "sr-only"
              : "font-serif text-xl font-normal"
          }
        >
          {title}
        </h2>
        <button
          type="button"
          disabled={!isDismissable}
          onClick={onClose}
          className="text-forest/70 hover:bg-forest/5 hover:text-forest rounded-full px-2 py-1 text-sm transition-colors"
          aria-label={closeLabel}
        >
          <X aria-hidden className="size-5" strokeWidth={2} />
        </button>
      </div>
      <div
        className={
          variant === "celebration"
            ? "overflow-y-auto px-6 pb-8 text-center sm:px-8"
            : "px-5 py-4"
        }
      >
        {children}
      </div>
    </dialog>
  );
}
