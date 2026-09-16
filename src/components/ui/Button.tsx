"use client";

import Link from "next/link";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";
import type { AnchorHTMLAttributes, AriaAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "icon-label";
export type ButtonColor =
  | "forest"
  | "terracotta"
  | "gold"
  | "earth"
  | "gray"
  | "black"
  | "white"
  | "cream"
  | "warm";
type ButtonSize = "sm" | "md" | "lg" | "icon-sm";
type ButtonShape = "pill" | "rounded";

type CommonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  shape?: ButtonShape;
  weight?: "bold" | "light";
  "aria-busy"?: AriaAttributes["aria-busy"];
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<AriaButtonProps, keyof CommonProps> & {
    href?: undefined;
    disabled?: boolean;
  };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<ButtonVariant, string> = {
  "icon-label": "group flex-col bg-transparent px-4 py-2 text-sm",
  primary: "border border-transparent",
  secondary: "bg-transparent border",
  ghost: "bg-transparent border border-transparent",
  link: "bg-transparent border-transparent underline-offset-4 hover:underline px-0 h-auto rounded-none",
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
  "inline-flex items-center justify-center gap-2 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

export function Button({
  children,
  className,
  variant = "primary",
  color = "forest",
  size = "md",
  shape = "pill",
  weight,
  ...props
}: ButtonProps) {
  const classes = cn(
    baseClasses,
    `button-color-${color}`,
    `button-variant-${variant}`,
    (weight ?? (variant === "icon-label" ? "light" : "bold")) === "light"
      ? "font-light"
      : "font-bold",
    variant !== "icon-label" && "uppercase",
    variant !== "link" && shapeClasses[shape],
    variantClasses[variant],
    variant !== "icon-label" &&
      (variant === "link" ? "text-sm tracking-[0.08em]" : sizeClasses[size]),
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
  const {
    type = "button",
    disabled,
    value,
    "aria-busy": busy,
    ...rest
  } = buttonProps;

  return (
    <AriaButton
      type={type}
      isDisabled={disabled}
      aria-busy={busy}
      isPending={busy === true || busy === "true"}
      value={value}
      className={classes}
      {...rest}
    >
      {children}
    </AriaButton>
  );
}
