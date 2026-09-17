import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { StaffCashDesk } from "@/features/checkout/StaffCashDesk";

export const metadata = { robots: { index: false, follow: false } };

export default async function StaffCashPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { order } = await searchParams;
  const reference =
    typeof order === "string" &&
    /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(order)
      ? order
      : "";
  return (
    <Section>
      <Container className="max-w-xl">
        <StaffCashDesk initialReference={reference} />
      </Container>
    </Section>
  );
}
