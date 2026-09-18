import { redirect } from "next/navigation";
import { localizePath } from "@/config/navigation";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(localizePath(locale, "/checkout/review"));
}
