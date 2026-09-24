"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CustomerAccount } from "@/types/account";

type AccountContextValue = {
  customer: CustomerAccount | null;
  loading: boolean;
  unavailable: boolean;
  submit: (input: Record<string, string>) => Promise<void>;
};
const AccountContext = createContext<AccountContextValue | null>(null);
export function AccountProvider({
  children,
  initialCustomer,
}: {
  children: ReactNode;
  initialCustomer?: CustomerAccount | null;
}) {
  const [customer, setCustomer] = useState<CustomerAccount | null>(
    initialCustomer ?? null,
  );
  const [loading, setLoading] = useState(initialCustomer === undefined);
  const [unavailable, setUnavailable] = useState(false);
  const revision = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const currentRevision = revision.current;
    void fetch("/api/account", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("account");
        const body = await response.json();
        if (!controller.signal.aborted && currentRevision === revision.current)
          setCustomer(body.customer ?? null);
      })
      .catch(() => {
        if (!controller.signal.aborted && currentRevision === revision.current)
          setUnavailable(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  async function submit(input: Record<string, string>) {
    revision.current++;
    const response = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error("account");
    const body = await response.json();
    setCustomer(body.customer ?? null);
    setUnavailable(false);
    window.dispatchEvent(new Event("magico-account-change"));
  }
  return (
    <AccountContext.Provider value={{ customer, loading, unavailable, submit }}>
      {children}
    </AccountContext.Provider>
  );
}
export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("AccountProvider required");
  return value;
}
