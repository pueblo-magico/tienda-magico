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
export const defaultLocale: Locale = "en";