"use client";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAccount } from "@/lib/account/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function AccountPage({ register = false }: { register?: boolean }) {
  const t = useTranslations("account");
  const router = useRouter();
  const { customer, loading, unavailable, submit } = useAccount();
  const [registration, setRegistration] = useState(register);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle variant="editorial">
          {t(customer ? "data" : registration ? "register" : "login")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p role="status">{t("loading")}</p>
        ) : customer ? (
          <dl>
            <dt>{t("name")}</dt>
            <dd>{customer.name}</dd>
            <dt>{t("email")}</dt>
            <dd>{customer.email}</dd>
          </dl>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (pending.current) return;
              pending.current = true;
              setBusy(true);
              setFailed(false);
              const form = event.currentTarget;
              const data = new FormData(form);
              void submit({
                action: registration ? "register" : "login",
                name: String(data.get("name") ?? ""),
                email: String(data.get("email") ?? ""),
                password: String(data.get("password") ?? ""),
              })
                .then(() => {
                  form.reset();
                  router.refresh();
                })
                .catch(() => setFailed(true))
                .finally(() => {
                  pending.current = false;
                  setBusy(false);
                });
            }}
          >
            {registration ? (
              <Input
                name="name"
                label={t("name")}
                autoComplete="name"
                maxLength={120}
                required
                disabled={busy}
              />
            ) : null}
            <Input
              name="email"
              type="email"
              label={t("email")}
              autoComplete="email"
              maxLength={254}
              required
              disabled={busy}
            />
            <Input
              name="password"
              type="password"
              label={t("password")}
              autoComplete={registration ? "new-password" : "current-password"}
              minLength={registration ? 12 : 1}
              maxLength={128}
              required
              disabled={busy}
            />
            {registration ? (
              <p className="text-text-primary text-sm">{t("passwordHint")}</p>
            ) : null}
            {failed || unavailable ? (
              <p role="alert" className="text-terracotta">
                {t("error")}
              </p>
            ) : null}
            <CardFooter className="flex-wrap px-0">
              <Button type="submit" disabled={busy}>
                {t(busy ? "loading" : registration ? "register" : "login")}
              </Button>
              <Button
                variant="link"
                disabled={busy}
                onPress={() => setRegistration(!registration)}
              >
                {t(registration ? "login" : "register")}
              </Button>
            </CardFooter>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
