import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  footerNavigation,
  resolveNavigationHref,
  type Locale,
} from "@/config/navigation";
import { Container } from "./Container";
import { cn } from "@/lib/utils/cn";

export async function Footer({ className }: { className?: string }) {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;

  return (
    <footer className={cn("border-border bg-card border-t", className)}>
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-2">
          <p className="text-forest font-serif text-2xl">Pueblo Mágico</p>
          <p className="text-forest/70 max-w-md text-sm leading-relaxed">
            {t("footer.tagline")}
          </p>
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

      <div className="border-border border-t">
        <Container className="text-forest/55 flex flex-col gap-2 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Pueblo Mágico</p>
          <p>{t("footer.rights")}</p>
        </Container>
      </div>
    </footer>
  );
}
