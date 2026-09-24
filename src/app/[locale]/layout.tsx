import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CartDrawer, CartProvider } from "@/features/cart";
import { routing } from "@/i18n/routing";
import { ImpactFooter } from "@/features/shop/ImpactFooter";
import { AccountProvider } from "@/lib/account/client";
import { getSiteSettings, getHeaderLogo, getSeoMetadata } from "@/lib/cms";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  return getSeoMetadata((await params).locale);
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const settings = await getSiteSettings(locale);
  const logo = await getHeaderLogo(locale, settings);

  return (
    <NextIntlClientProvider messages={messages}>
      <AccountProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Header logo={logo} siteName={settings.siteName} />
            <div className="flex-1">{children}</div>
            <Container className="relative z-10 -mt-10">
              <ImpactFooter />
            </Container>
            <Footer />
          </div>
          <CartDrawer />
        </CartProvider>
      </AccountProvider>
    </NextIntlClientProvider>
  );
}
