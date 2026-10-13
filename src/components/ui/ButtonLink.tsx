import Link from "next/link";
import type { ComponentProps } from "react";
import {
  buttonVariants,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
} from "@pueblo-magico/react-ui";
import { cn } from "@/lib/utils/cn";

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  className?: string;
  shape?: ButtonShape;
  size?: ButtonSize | "icon-sm";
  variant?: ButtonVariant | "link";
};

/** Router adapter for the shared button styles; actions use the library Button. */
export function ButtonLink({
  className,
  shape,
  size,
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  const isTextLink = variant === "link";

  return (
    <Link
      className={cn(
        buttonVariants({
          shape: isTextLink ? "rounded" : shape,
          size: size === "icon-sm" ? "icon" : size,
          variant: isTextLink ? "ghost" : variant,
        }),
        isTextLink &&
          "h-auto rounded-none px-0 text-sm underline-offset-4 hover:underline",
        className,
      )}
      {...props}
    />
  );
}
