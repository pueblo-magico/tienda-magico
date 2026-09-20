"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CustomerAccount } from "@/types/account";

type AccountContextValue = { customer: CustomerAccount | null; loading: boolean; submit: (input: Record<string, string>) => Promise<void> };
const AccountContext = createContext<AccountContextValue | null>(null);
export function AccountProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/account", { cache: "no-store", signal: controller.signal }).then(async response => {
      if (!response.ok) return;
      const body = await response.json();
      setCustomer(body.customer ?? null);
    }).catch(() => {}).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  async function submit(input: Record<string, string>) {
    const response = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (!response.ok) throw new Error("account");
    const body = await response.json();
    setCustomer(body.customer ?? null);
    window.dispatchEvent(new Event("magico-account-change"));
  }
  return <AccountContext.Provider value={{ customer, loading, submit }}>{children}</AccountContext.Provider>;
}
export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("AccountProvider required");
  return value;
}
