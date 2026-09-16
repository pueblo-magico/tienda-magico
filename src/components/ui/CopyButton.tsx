"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./Button";

type Props = {
  value: string;
  label: string;
  copiedLabel: string;
  errorLabel: string;
};

export function CopyButton({ value, label, copiedLabel, errorLabel }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  return (
    <span className="inline-flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        title={label}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setState("copied");
          } catch {
            setState("error");
          }
        }}
      >
        {state === "copied" ? (
          <Check aria-hidden className="size-4" strokeWidth={2} />
        ) : (
          <Copy aria-hidden className="size-4" strokeWidth={2} />
        )}
      </Button>
      <span
        role="status"
        className={state === "error" ? "text-text-primary text-xs" : "sr-only"}
      >
        {state === "copied" ? copiedLabel : state === "error" ? errorLabel : ""}
      </span>
    </span>
  );
}
