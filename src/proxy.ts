import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const legacySpanishSegments: Record<string, string> = {
  shop: "tienda",
  cart: "carrito",
  about: "nosotros",
  shipping: "envios",
  contact: "contacto",
  impact: "impacto",
};

export default function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  if (segments[0] === "es" && legacySpanishSegments[segments[1]]) {
    segments[1] = legacySpanishSegments[segments[1]];
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${segments.join("/")}`;
    return NextResponse.redirect(redirectUrl, 308);
  }
  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    // Match all pathnames except api, _next, ui-system, and static files
    "/((?!api|ui-system|_next|_vercel|.*\\..*).*)",
  ],
};
