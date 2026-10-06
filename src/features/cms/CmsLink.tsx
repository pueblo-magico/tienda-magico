import type { ButtonVariant } from "@pueblo-magico/react-ui";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { localizePath } from "@/config/navigation";
import type { CmsLink as CmsLinkType } from "@/lib/cms";

function resolveHref(link: CmsLinkType, locale: string): string | null {
  if (link.type === "internal" && link.path) {
    const path = link.path.startsWith("/") ? link.path : `/${link.path}`;
    return localizePath(locale, path);
  }
  if (link.url) return link.url;
  if (link.path) {
    const path = link.path.startsWith("/") ? link.path : `/${link.path}`;
    return localizePath(locale, path);
  }
  return null;
}

function toVariant(
  appearance?: CmsLinkType["appearance"],
): ButtonVariant | "link" {
  switch (appearance) {
    case "secondary":
      return "secondary";
    case "ghost":
      return "ghost";
    case "link":
      return "link";
    case "primary":
    case "default":
    default:
      return "primary";
  }
}

export function CmsLinkButton({
  link,
  locale,
  className,
}: {
  link: CmsLinkType | null | undefined;
  locale: string;
  className?: string;
}) {
  if (!link?.label) return null;
  const href = resolveHref(link, locale);
  if (!href) return null;

  return (
    <ButtonLink
      href={href}
      variant={toVariant(link.appearance)}
      className={className}
      target={link.newTab ? "_blank" : undefined}
      rel={link.newTab ? "noopener noreferrer" : undefined}
    >
      {link.label}
    </ButtonLink>
  );
}
