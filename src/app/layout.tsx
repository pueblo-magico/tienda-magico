import type { Metadata } from "next";
import { Jost, Marcellus } from "next/font/google";
import "./globals.css";
import { getLocale } from "next-intl/server";
import { defaultBrand } from "@/config/brand";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "700"],
  display: "swap",
});

const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: defaultBrand.name,
  icons: "/favicon.svg",
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={`${jost.variable} ${marcellus.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
