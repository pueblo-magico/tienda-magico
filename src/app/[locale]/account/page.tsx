import { Container } from "@/components/layout/Container";
import { AccountPage } from "@/features/account/AccountPage";
export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  return <Container className="max-w-xl py-10"><AccountPage register={mode === "register"} /></Container>;
}
