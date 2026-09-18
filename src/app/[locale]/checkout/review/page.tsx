import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { CheckoutReview } from "@/features/cart";

export default async function CheckoutReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Section spacing="lg" className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80"
      >
        <Image
          src="/images/cash-order-background.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-top"
        />
      </div>
      <Container>
        <CheckoutReview />
      </Container>
    </Section>
  );
}
