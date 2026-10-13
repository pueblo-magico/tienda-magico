import { setRequestLocale } from "next-intl/server";
import { Container } from "@pueblo-magico/react-ui";
import { Section } from "@pueblo-magico/react-ui";
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
