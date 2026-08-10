import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-brand-foreground hover:bg-brand-hover active:bg-brand-active border border-transparent",
  secondary:
    "bg-transparent text-brand border border-brand/30 hover:border-brand hover:bg-brand/5 active:bg-brand/10",
  ghost:
    "bg-transparent text-brand border border-transparent hover:bg-brand/5 active:bg-brand/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs tracking-[0.08em]",
  md: "h-11 px-6 text-sm tracking-[0.1em]",
  lg: "h-12 px-8 text-sm tracking-[0.12em]",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full font-medium uppercase",
        "transition-colors duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}