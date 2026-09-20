"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function useOrderCounts(refreshCart: () => Promise<void>) {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  useEffect(() => {
    let stopped = false;
    let busy = false;
    let approvedCount: number | undefined;
    const controller = new AbortController();
    const refresh = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const response = await fetch("/api/orders", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const result = await response.json();
        if (
          stopped ||
          !Number.isSafeInteger(result.pendingCount) ||
          result.pendingCount < 0 ||
          !Number.isSafeInteger(result.approvedCount) ||
          result.approvedCount < 0
        )
          return;
        setCount(result.pendingCount);
        if (result.approvedCount !== approvedCount && result.approvedCount > 0)
          await refreshCart();
        approvedCount = result.approvedCount;
      } catch {
        // Conservá el último contador si la conexión falla; no borres el carrito.
      } finally {
        busy = false;
      }
    };
    void refresh();
    const onRefresh = () => {
      void refresh();
    };
    const timer = window.setInterval(onRefresh, 15000);
    document.addEventListener("visibilitychange", onRefresh);
    window.addEventListener("orders-updated", onRefresh);
    window.addEventListener("magico-account-change", onRefresh);
    return () => {
      stopped = true;
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onRefresh);
      window.removeEventListener("orders-updated", onRefresh);
      window.removeEventListener("magico-account-change", onRefresh);
    };
  }, [pathname, refreshCart]);
  return count;
}
