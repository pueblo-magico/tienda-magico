"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { localizePath } from "@/config/navigation";
import { Body } from "@/components/typography";
import { CART_ID_STORAGE_KEY } from "@/features/cart/constants";
import { createCheckoutSession } from "./api";

function readStoredCartId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CART_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

type Props = {
  /** Server-provided cart id from ?cart= when present. */
  initialCartId?: string | null;
};

/**
 * Starts a provider checkout session and redirects the browser.
 * Used by /[locale]/checkout (Payload cart.checkoutUrl target) and as a recovery UI.
 */
export function CheckoutStart({ initialCartId }: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"starting" | "error">("starting");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const cartId =
      initialCartId?.trim() ||
      searchParams.get("cart")?.trim() ||
      readStoredCartId();

    if (!cartId) {
      setStatus("error");
      setError(t("missingCart"));
      return;
    }

    void (async () => {
      try {
        const result = await createCheckoutSession({ cartId, locale });
        const redirectUrl = result.session?.redirectUrl?.trim();
        if (!redirectUrl) {
          setStatus("error");
          setError(t("failed"));
          return;
        }

        // Guard against redirecting back to this same checkout entry page.
        try {
          const target = new URL(redirectUrl, window.location.origin);
          const here = new URL(window.location.href);
          if (
            target.origin === here.origin &&
            /\/checkout\/?$/.test(target.pathname.replace(/\/(en|es)(?=\/|$)/, ""))
          ) {
            // pathname like /en/checkout — treat as misconfigured payment provider
            setStatus("error");
            setError(t("providerNotConfigured"));
            return;
          }
          // Also block exact same path
          if (
            target.origin === here.origin &&
            target.pathname.replace(/\/$/, "") ===
              here.pathname.replace(/\/$/, "")
          ) {
            setStatus("error");
            setError(t("providerNotConfigured"));
            return;
          }
        } catch {
          // non-URL redirect — still try assign
        }

        window.location.assign(redirectUrl);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : t("failed"));
      }
    })();
  }, [initialCartId, locale, searchParams, t]);

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <Body className="text-forest/80">{error || t("failed")}</Body>
        <div className="flex flex-wrap justify-center gap-3">
          <Button href={localizePath(locale, "/cart")}>{t("backToCart")}</Button>
          <Button href={localizePath(locale, "/shop")} variant="ghost">
            {t("continueShopping")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-3 text-center">
      <Body className="text-forest/80">{t("redirecting")}</Body>
      <p className="text-xs text-muted">{t("redirectingHint")}</p>
    </div>
  );
}
