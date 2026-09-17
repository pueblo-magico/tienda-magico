import { BackdropImage } from "@/components/layout/BackdropImage";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Sprout } from "lucide-react";
import { commerce } from "@/lib/commerce";
import { getSiteSettings } from "@/lib/cms";
import { guestCartReferences } from "@/lib/checkout/guest-orders";
import { Container } from "@/components/layout/Container";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Body, PageTitle } from "@/components/typography";
import { buildWhatsAppUrl } from "@/features/impact";
import { OrderList } from "@/features/orders/OrderList";
import { RecoverOrders } from "./RecoverOrders";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("orders");
  const [references, settings] = await Promise.all([
    guestCartReferences(),
    getSiteSettings(locale),
  ]);
  let failed = false;
  const orders = await commerce.getGuestOrders(references).catch(() => {
    failed = true;
    return [];
  });
  return (
    <>
      <section className="bg-background-secondary relative isolate overflow-hidden">
        {settings.shopHeroImage ? (
          <BackdropImage
            src={settings.shopHeroImage.url}
            sizes="100vw"
            className="-z-20"
          />
        ) : null}
        <div className="bg-text-black/60 absolute inset-0 -z-10" />
        <Container className="py-12 sm:py-16">
          <PageTitle tone="inverse">{t("title")}</PageTitle>
          <Body tone="inverse" className="mt-4 max-w-xl">
            {t("browserHint")}
          </Body>
        </Container>
      </section>
      <Container className="space-y-8 py-8 sm:py-10">
        <RecoverOrders />
        {failed ? (
          <p role="alert" className="text-text-primary">
            {t("unavailable")}
          </p>
        ) : (
          <OrderList orders={orders} serverTime={Date.now()} />
        )}
        <Card>
          <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Sprout
              aria-hidden
              className="text-text-accent size-10 shrink-0"
              strokeWidth={1.5}
            />
            <div className="flex-1 space-y-1">
              <CardTitle>{t("supportTitle")}</CardTitle>
              <CardDescription>{t("supportBody")}</CardDescription>
            </div>
            <Button
              href={buildWhatsAppUrl(
                settings.contactPhone ?? undefined,
                t("supportMessage"),
              )}
              variant="secondary"
              size="sm"
              target="_blank"
              rel="noreferrer"
            >
              {t("support")}
            </Button>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
