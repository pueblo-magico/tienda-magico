type NavigationItemBase = {
  href: string;
  labelKey: string;
  label: {
    en: string;
    es: string;
  };
};

export type InternalNavItem = NavigationItemBase & {
  kind: "internal";
};

export type ExternalNavItem = NavigationItemBase & {
  kind: "external";
};

export type NavItem = InternalNavItem | ExternalNavItem;

export const externalSites = {
  experienciaMagico: "https://experienciamagico.com",
} as const;

export function experienciaMagicoUrl(path = "/"): string {
  return new URL(path, externalSites.experienciaMagico).toString();
}

export const legalLinks = {
  terms: experienciaMagicoUrl("/terminos-y-condiciones"),
  privacy: experienciaMagicoUrl("/politica-de-privacidad"),
} as const;

export const mainNavigation: NavItem[] = [
  {
    kind: "internal",
    href: "/shop",
    labelKey: "nav.shop",
    label: { en: "Shop", es: "Tienda" },
  },
  {
    kind: "external",
    href: experienciaMagicoUrl("/estadia"),
    labelKey: "nav.stay",
    label: { en: "Stay", es: "Estadías" },
  },
  {
    kind: "external",
    href: experienciaMagicoUrl("/#experiencias"),
    labelKey: "nav.experiences",
    label: { en: "Experiences", es: "Experiencias" },
  },
  {
    kind: "internal",
    href: "/impact",
    labelKey: "nav.impact",
    label: { en: "Impact", es: "Impacto" },
  },
  {
    kind: "external",
    href: experienciaMagicoUrl("/#nosotros"),
    labelKey: "nav.about",
    label: { en: "About", es: "Nosotros" },
  },
  {
    kind: "external",
    href: experienciaMagicoUrl(),
    labelKey: "nav.mainSite",
    label: { en: "Visit Pueblo Mágico", es: "Visitar Pueblo Mágico" },
  },
];

export const footerNavigation = {
  explore: mainNavigation,
  support: [
    {
      kind: "external",
      href: experienciaMagicoUrl("/#contacto"),
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
    impact: "impacto",
  },
  en: {
    shop: "shop",
    cart: "cart",
    about: "about",
    shipping: "shipping",
    contact: "contact",
    impact: "impact",
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

/** Resolve a configured navigation item without localizing external URLs. */
export function resolveNavigationHref(
  item: NavItem,
  locale: Locale | string,
): string {
  return item.kind === "internal" ? localizePath(locale, item.href) : item.href;
}

/** Determine whether an internal navigation item owns the current pathname. */
export function isNavigationItemActive(
  item: NavItem,
  locale: Locale | string,
  pathname: string,
): boolean {
  if (item.kind !== "internal") return false;
  const href = resolveNavigationHref(item, locale).replace(/\/$/, "");
  const currentPath = pathname.replace(/\/$/, "");
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

/** Resolve a public localized pathname back to a shared internal route. */
export function internalPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const locale = locales.includes(segments[0] as Locale)
    ? (segments.shift() as Locale)
    : defaultLocale;
  const reverse = Object.fromEntries(
    Object.entries(localizedSegments[locale]).map(([key, value]) => [
      value,
      key,
    ]),
  );
  if (segments[0]) segments[0] = reverse[segments[0]] ?? segments[0];
  return `/${segments.join("/")}`;
}
