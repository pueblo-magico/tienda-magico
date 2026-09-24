import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  footerNavigation,
  resolveNavigationHref,
  type Locale,
} from "@/config/navigation";
import { Container } from "./Container";
import { LegalFooter } from "./LegalFooter";
import { cn } from "@/lib/utils/cn";
import { getSiteSettings } from "@/lib/cms";

export async function Footer({ className }: { className?: string }) {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const settings = await getSiteSettings(locale);

  return (
    <footer className={cn("border-border bg-card border-t", className)}>
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-2">
          <p className="text-forest font-serif text-2xl">{settings.siteName}</p>
          <p className="text-forest/70 max-w-md text-sm leading-relaxed">
            {settings.tagline ?? t("footer.tagline")}
          </p>
          <ul className="text-text-primary flex flex-wrap gap-4 text-sm">
            {settings.contactEmail ? (
              <li>
                <a href={`mailto:${settings.contactEmail}`}>
                  {settings.contactEmail}
                </a>
              </li>
            ) : null}
            {settings.contactPhone ? (
              <li>
                <a href={`tel:${settings.contactPhone.replace(/[^+\d]/g, "")}`}>
                  {settings.contactPhone}
                </a>
              </li>
            ) : null}
            {settings.social.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-forest/50 mb-3 text-xs font-medium tracking-[0.16em] uppercase">
            {t("footer.explore")}
          </p>
          <ul className="space-y-2">
            {footerNavigation.explore.map((item) => (
              <li key={item.href}>
                <Link
                  href={resolveNavigationHref(item, locale)}
                  className="text-forest/75 hover:text-forest text-sm transition-colors"
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-forest/50 mb-3 text-xs font-medium tracking-[0.16em] uppercase">
            {t("footer.support")}
          </p>
          <ul className="space-y-2">
            {footerNavigation.support.map((item) => (
              <li key={item.href}>
                <Link
                  href={resolveNavigationHref(item, locale)}
                  className="text-forest/75 hover:text-forest text-sm transition-colors"
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <LegalFooter />
    </footer>
  );
}
