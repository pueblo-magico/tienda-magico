import type { Metadata } from "next";
import { Jost, Marcellus } from "next/font/google";
import "./globals.css";

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
  title: {
    default: "Pueblo Mágico",
    template: "%s · Pueblo Mágico",
  },
  description:
    "Conscious products inspired by the mountains, community, and regenerative living.",
  icons: "/favicon.svg",
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jost.variable} ${marcellus.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
