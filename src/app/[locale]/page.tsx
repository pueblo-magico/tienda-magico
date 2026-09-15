import { redirect } from "next/navigation";
import { localizePath } from "@/config/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  redirect(localizePath(locale, "/shop"));
}
