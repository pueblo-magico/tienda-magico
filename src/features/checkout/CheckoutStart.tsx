"use client";

import { useLocale, useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { localizePath } from "@/config/navigation";

export function CheckoutStart() {
  const locale = useLocale();
  const t = useTranslations("cart");
  return (
    <ButtonLink href={localizePath(locale, "/checkout/review")}>
      {t("reviewPurchase")}
    </ButtonLink>
  );
}
