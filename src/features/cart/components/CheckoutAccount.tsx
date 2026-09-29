"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAccount } from "@/lib/account/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CheckoutAccount({
  name,
  email,
  onUseData,
}: {
  name: string;
  email: string;
  onUseData: (name: string, email: string) => void;
}) {
  const { customer, loading, unavailable, submit } = useAccount();
  const t = useTranslations("account");
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login" | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  async function authenticate(action: "register" | "login" | "logout") {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setFailed(false);
    try {
      await submit({ action, name, email, password });
      setPassword("");
      setMode(null);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const error =
    failed || unavailable ? (
      <p role="alert" className="text-terracotta">
        {t("error")}
      </p>
    ) : null;
  if (loading) return null;
  if (customer)
    return (
      <div className="space-y-3 py-3">
        <div className="flex flex-wrap gap-4">
          <Button
            variant="link"
            disabled={busy}
            onPress={() => onUseData(customer.name, customer.email)}
          >
            {t("useData")}
          </Button>
          <Button
            variant="link"
            disabled={busy}
            onPress={() => void authenticate("logout")}
          >
            {t(busy ? "loading" : "logout")}
          </Button>
        </div>
        {error}
      </div>
    );
  return (
    <div className="space-y-3 py-3">
      <p className="text-text-primary text-sm">{t("optional")}</p>
      <div className="flex flex-wrap gap-4">
        {(["register", "login"] as const).map((action) => (
          <Button
            key={action}
            variant="link"
            disabled={busy}
            aria-expanded={mode === action}
            onPress={() => {
              setMode(mode === action ? null : action);
              setPassword("");
              setFailed(false);
            }}
          >
            {t(action)}
          </Button>
        ))}
      </div>
      {mode ? (
        <>
          <Input
            type="password"
            label={t("password")}
            hint={mode === "register" ? t("passwordHint") : undefined}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            maxLength={128}
            disabled={busy}
          />
          <Button
            disabled={
              busy ||
              password.length < (mode === "register" ? 12 : 1) ||
              (mode === "register" && !name.trim()) ||
              !email.trim()
            }
            onPress={() => void authenticate(mode)}
          >
            {t(busy ? "loading" : mode)}
          </Button>
        </>
      ) : null}
      {error}
    </div>
  );
}
