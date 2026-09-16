import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Button, type ButtonProps } from "./Button";

type IconActionProps = ButtonProps & { icon: ReactNode; loading?: boolean };

export function IconAction({
  icon,
  loading = false,
  children,
  ...props
}: IconActionProps) {
  return (
    <Button {...props} variant="icon-label" aria-busy={loading || undefined}>
      <span
        aria-hidden
        className="border-border bg-card group-hover:border-brand group-hover:bg-card-hover flex size-14 items-center justify-center rounded-full border transition-colors"
      >
        {loading ? (
          <LoaderCircle
            className="size-6 animate-spin motion-reduce:animate-none"
            strokeWidth={1.5}
          />
        ) : (
          icon
        )}
      </span>
      <span>{children}</span>
    </Button>
  );
}
