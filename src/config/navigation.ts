export type NavItem = {
  href: string;
  labelKey: string;
  label: {
    en: string;
    es: string;
  };
};

export const mainNavigation: NavItem[] = [
  {
    href: "/shop",
    labelKey: "nav.shop",
    label: { en: "Shop", es: "Tienda" },
  },
  {
    href: "/rituals",
    labelKey: "nav.rituals",
    label: { en: "Rituals", es: "Rituales" },
  },
  {
    href: "/experiences",
    labelKey: "nav.experiences",
    label: { en: "Experiences", es: "Experiencias" },
  },
  {
    href: "/journal",
    labelKey: "nav.journal",
    label: { en: "Journal", es: "Diario" },
  },
  {
    href: "/impact",
    labelKey: "nav.impact",
    label: { en: "Impact", es: "Impacto" },
  },
  {
    href: "/about",
    labelKey: "nav.about",
    label: { en: "About", es: "Nosotros" },
  },
];

export const footerNavigation = {
  explore: mainNavigation,
  support: [
    {
      href: "/shipping",
      labelKey: "nav.shipping",
      label: { en: "Shipping", es: "Envíos" },
    },
    {
      href: "/faq",
      labelKey: "nav.faq",
      label: { en: "FAQ", es: "Preguntas" },
    },
    {
      href: "/contact",
      labelKey: "nav.contact",
      label: { en: "Contact", es: "Contacto" },
    },
  ] satisfies NavItem[],
};

export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

const localizedSegments: Record<Locale, Record<string, string>> = {
  es: {
    shop: "tienda",
    cart: "carrito",
    about: "nosotros",
    shipping: "envios",
    contact: "contacto",
  },
  en: {
    shop: "shop",
    cart: "cart",
    about: "about",
    shipping: "shipping",
    contact: "contact",
  },
};

/** Convert an internal, locale-free route into its public localized URL. */
export function localizePath(locale: Locale | string, path = "/"): string {
  const safeLocale: Locale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;
  const url = new URL(path, "https://local.invalid");
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments[0]) {
    segments[0] = localizedSegments[safeLocale][segments[0]] ?? segments[0];
  }
  const pathname = segments.length ? `/${segments.join("/")}` : "";
  return `/${safeLocale}${pathname}${url.search}${url.hash}`;
}

/** Resolve a public localized pathname back to a shared internal route. */
export function internalPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const locale = locales.includes(segments[0] as Locale)
    ? (segments.shift() as Locale)
    : defaultLocale;
  const reverse = Object.fromEntries(
    Object.entries(localizedSegments[locale]).map(([key, value]) => [value, key]),
  );
  if (segments[0]) segments[0] = reverse[segments[0]] ?? segments[0];
  return `/${segments.join("/")}`;
}
