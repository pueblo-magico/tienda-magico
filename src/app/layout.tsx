import type { Metadata } from "next";
import { Inter, Marcellus, Nunito } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: "500",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pueblo Mágico",
    template: "%s · Pueblo Mágico",
  },
  description:
    "Conscious products inspired by the mountains, community, and regenerative living.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${marcellus.variable} ${nunito.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
