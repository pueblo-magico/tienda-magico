import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all pathnames except api, _next, ui-system, and static files
    "/((?!api|ui-system|_next|_vercel|.*\\..*).*)",
  ],
};
