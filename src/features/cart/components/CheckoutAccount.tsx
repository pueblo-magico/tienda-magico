"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  if (loading) return null;
  if (customer)
    return (
      <Button
        variant="link"
        onPress={() => onUseData(customer.name, customer.email)}
      >
        {t("useData")}
      </Button>
    );
  return (
    <div className="space-y-3 py-3">
      <p className="text-text-primary text-sm">{t("optional")}</p>
      <Button variant="link" onPress={() => setOpen(!open)}>
        {t("register")}
      </Button>
      {open ? (
        <>
          <Input
            type="password"
            label={t("password")}
            hint={t("passwordHint")}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            maxLength={128}
            disabled={busy}
          />
          <Button
            disabled={
              busy || password.length < 12 || !name.trim() || !email.trim()
            }
            onPress={() => {
              if (pending.current) return;
              pending.current = true;
              setBusy(true);
              setFailed(false);
              void submit({ action: "register", name, email, password })
                .then(() => setPassword(""))
                .catch(() => setFailed(true))
                .finally(() => {
                  pending.current = false;
                  setBusy(false);
                });
            }}
          >
            {t(busy ? "loading" : "register")}
          </Button>
          {failed || unavailable ? (
            <p role="alert" className="text-terracotta">
              {t("error")}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
