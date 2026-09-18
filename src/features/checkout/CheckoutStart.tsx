"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { localizePath } from "@/config/navigation";

export function CheckoutStart() {
  const locale = useLocale();
  const t = useTranslations("cart");
  return (
    <Button href={localizePath(locale, "/checkout/review")}>
      {t("reviewPurchase")}
    </Button>
  );
}
