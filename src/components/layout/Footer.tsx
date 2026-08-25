import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { footerNavigation, localizePath, type Locale } from "@/config/navigation";
import { Container } from "./Container";
import { cn } from "@/lib/utils/cn";

export async function Footer({ className }: { className?: string }) {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const localize = (href: string) => localizePath(locale, href);

  return (
    <footer className={cn("border-t border-border bg-muted/50", className)}>
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-2">
          <p className="font-serif text-2xl text-forest">Pueblo Mágico</p>
          <p className="max-w-md text-sm leading-relaxed text-forest/70">
            {t("footer.tagline")}
          </p>
        </div>

        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-forest/50">
            {t("footer.explore")}
          </p>
          <ul className="space-y-2">
            {footerNavigation.explore.map((item) => (
              <li key={item.href}>
                <Link
                  href={localize(item.href)}
                  className="text-sm text-forest/75 transition-colors hover:text-forest"
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-forest/50">
            {t("footer.support")}
          </p>
          <ul className="space-y-2">
            {footerNavigation.support.map((item) => (
              <li key={item.href}>
                <Link
                  href={localize(item.href)}
                  className="text-sm text-forest/75 transition-colors hover:text-forest"
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col gap-2 py-4 text-xs text-forest/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Pueblo Mágico</p>
          <p>{t("footer.rights")}</p>
        </Container>
      </div>
    </footer>
  );
}
