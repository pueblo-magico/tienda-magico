import { setRequestLocale } from "next-intl/server";

export const metadata = { robots: { index: false, follow: false } };
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { CartPageContent } from "@/features/cart";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Section spacing="md">
      <Container className="max-w-6xl">
        <CartPageContent />
      </Container>
    </Section>
  );
}
