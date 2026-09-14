import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
type ButtonSize = "sm" | "md" | "lg" | "icon-sm";
type ButtonShape = "pill" | "rounded";

type CommonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-brand-foreground hover:bg-brand-hover active:bg-brand-active border border-transparent",
  secondary:
    "bg-transparent text-brand border border-brand/30 hover:border-brand hover:bg-brand/5 active:bg-brand/10",
  ghost:
    "bg-transparent text-brand border border-transparent hover:bg-brand/5 active:bg-brand/10",
  link: "bg-transparent border-transparent text-brand underline-offset-4 hover:underline px-0 h-auto rounded-none",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs tracking-[0.08em]",
  md: "h-11 px-6 text-sm tracking-[0.1em]",
  lg: "h-12 px-8 text-sm tracking-[0.12em]",
  "icon-sm": "size-8 p-0",
};

const shapeClasses: Record<ButtonShape, string> = {
  pill: "rounded-full",
  rounded: "rounded-md",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 font-bold uppercase transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  shape = "pill",
  ...props
}: ButtonProps) {
  const classes = cn(
    baseClasses,
    variant !== "link" && shapeClasses[shape],
    variantClasses[variant],
    variant === "link" ? "text-sm tracking-[0.08em]" : sizeClasses[size],
    className,
  );

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  const { type = "button", ...rest } = buttonProps;

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
