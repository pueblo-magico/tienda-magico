import { Container } from "@/components/layout/Container";
import { AccountPage } from "@/features/account/AccountPage";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageTitle } from "@/components/typography";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<{ mode?: string }>;
  params: Promise<{ locale: string }>;
}) {
  setRequestLocale((await params).locale);
  const t = await getTranslations("account");
  const { mode } = await searchParams;
  return (
    <Container className="max-w-xl py-10">
      <PageTitle className="sr-only">{t("title")}</PageTitle>
      <AccountPage register={mode === "register"} />
    </Container>
  );
}
