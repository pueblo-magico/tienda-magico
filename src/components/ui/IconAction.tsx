"use client";

import type { ComponentProps, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Button, type ButtonProps } from "@pueblo-magico/react-ui";
import { ButtonLink } from "./ButtonLink";

type CommonProps = { children: ReactNode; icon: ReactNode; loading?: boolean };
type IconActionProps = CommonProps &
  (
    | ({ href: string } & Omit<
        ComponentProps<typeof ButtonLink>,
        "children" | "href"
      >)
    | ({ href?: undefined } & Omit<ButtonProps, "children">)
  );

export function IconAction({
  icon,
  loading = false,
  children,
  ...props
}: IconActionProps) {
  const content = (
    <>
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
      <span aria-busy={loading || undefined}>{children}</span>
    </>
  );
  const className =
    "group h-auto flex-col rounded-none bg-transparent px-4 py-2 text-sm font-light normal-case";

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <ButtonLink
        {...linkProps}
        href={href}
        variant="ghost"
        className={className}
      >
        {content}
      </ButtonLink>
    );
  }

  const buttonProps = props as Omit<ButtonProps, "children">;
  return (
    <Button
      {...buttonProps}
      variant="ghost"
      isLoading={false}
      aria-busy={loading || undefined}
      className={className}
    >
      {content}
    </Button>
  );
}
