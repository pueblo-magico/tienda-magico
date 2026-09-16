import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";
import { defaultLocale, locales } from "@/config/navigation";

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
  pathnames: {
    "/orders": { en: "/orders", es: "/mis-pedidos" },
    "/shop": { en: "/shop", es: "/tienda" },
    "/shop/[handle]": { en: "/shop/[handle]", es: "/tienda/[handle]" },
    "/cart": { en: "/cart", es: "/carrito" },
    "/about": { en: "/about", es: "/nosotros" },
    "/shipping": { en: "/shipping", es: "/envios" },
    "/contact": { en: "/contact", es: "/contacto" },
    "/impact": { en: "/impact", es: "/impacto" },
  },
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
