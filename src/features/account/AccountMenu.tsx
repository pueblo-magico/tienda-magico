"use client";
import { UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useAccount } from "@/lib/account/client";
import { localizePath } from "@/config/navigation";
export function AccountMenu({ pendingOrders }: { pendingOrders: number }) {
  const t = useTranslations("account");
  const locale = useLocale();
  const router = useRouter();
  const { customer, loading, unavailable, submit } = useAccount();
  const [failed, setFailed] = useState(false);
  const items = [
    { id: "orders", label: t("orders"), href: localizePath(locale, "/orders") },
    ...(customer
      ? [
          {
            id: "data",
            label: t("data"),
            href: localizePath(locale, "/account"),
          },
          {
            id: "logout",
            label: t("logout"),
            onAction: () => {
              void submit({ action: "logout" })
                .then(() => {
                  router.refresh();
                })
                .catch(() => setFailed(true));
            },
          },
        ]
      : [
          {
            id: "register",
            label: t("register"),
            href: localizePath(locale, "/account?mode=register"),
          },
          {
            id: "login",
            label: t("login"),
            href: localizePath(locale, "/account"),
          },
        ]),
  ];
  return (
    <div className="relative">
      <DropdownMenu
        label={
          pendingOrders > 0
            ? t("pendingLabel", { count: pendingOrders })
            : t("title")
        }
        icon={<UserRound aria-hidden className="size-5" strokeWidth={2} />}
        items={loading ? items.slice(0, 1) : items}
      />
      {pendingOrders > 0 ? (
        <span
          aria-hidden
          className="bg-clay text-brand-foreground pointer-events-none absolute -top-1 -right-1 rounded-full px-1 text-xs"
        >
          {pendingOrders}
        </span>
      ) : null}
      {failed || unavailable ? (
        <p role="alert" className="text-terracotta text-xs">
          {t("error")}
        </p>
      ) : null}
    </div>
  );
}
