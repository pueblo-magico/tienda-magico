import { getTranslations, setRequestLocale } from "next-intl/server";
import { commerce, formatMoney } from "@/lib/commerce";
import { guestCartReferences } from "@/lib/checkout/guest-orders";
import { getTransferWaitingState } from "@/lib/checkout/transfer-waiting";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, PageTitle } from "@/components/typography";
import { Button } from "@/components/ui/Button";
import { RecoverOrders } from "./RecoverOrders";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("orders");
  const references = await guestCartReferences();
  let failed = false;
  const orders = await commerce.getGuestOrders(references).catch(() => {
    failed = true;
    return [];
  });
  return (
    <Section spacing="lg">
      <Container className="space-y-6">
        <PageTitle as="h1">{t("title")}</PageTitle>
        <Body>{t("browserHint")}</Body>
        {failed ? (
          <p role="alert">{t("unavailable")}</p>
        ) : !orders.length ? (
          <Body>{t("empty")}</Body>
        ) : null}
        <RecoverOrders />
        <ul className="grid gap-4 md:grid-cols-2">
          {orders.map((order) => {
            const state =
              order.paymentMethod === "bank-transfer"
                ? getTransferWaitingState(
                    order.paymentStatus,
                    order.paymentExpiresAt,
                    Date.now(),
                  ).status
                : order.paymentStatus;
            const reported =
              order.transferReportedAt &&
              ["pending", "expired", "unverified"].includes(state);
            const query = new URLSearchParams({
              payment_method: order.paymentMethod,
              order: order.publicReference,
            });
            return (
              <li
                key={order.publicReference}
                className="border-border bg-card text-text-primary space-y-3 rounded-2xl border p-5"
              >
                <h2 className="font-bold">
                  {t(`states.${reported ? "reported" : state}`)}
                </h2>
                <p className="text-sm break-all">
                  {t("reference", { reference: order.publicReference })}
                </p>
                <p>{formatMoney(order.total, locale)}</p>
                {order.newerReference ? (
                  <p className="text-text-secondary text-sm">
                    {t("newer", { reference: order.newerReference })}
                  </p>
                ) : null}
                {order.paymentExpiresAt ? (
                  <p>
                    {t("deadline", {
                      date: new Date(order.paymentExpiresAt).toLocaleString(
                        locale,
                      ),
                    })}
                  </p>
                ) : null}
                {order.paymentMethod === "bank-transfer" ? (
                  <Button
                    href={`/${locale}/checkout/pending?${query}`}
                    variant="secondary"
                  >
                    {t("view")}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
