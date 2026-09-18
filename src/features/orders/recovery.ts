import { parseGuestCartReferences } from "@/lib/commerce/guest-order-access";

type RecoveryResult = "recovered" | "empty" | "failed";

export function createOrderRecovery() {
  const attempts = new Map<string, Promise<RecoveryResult>>();
  return (cartReference: string): Promise<RecoveryResult> => {
    if (!parseGuestCartReferences(JSON.stringify([cartReference])).length) {
      return Promise.resolve("empty");
    }
    const existing = attempts.get(cartReference);
    if (existing) return existing;
    const attempt = (async (): Promise<RecoveryResult> => {
      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartReference }),
          signal: AbortSignal.timeout(10000),
        });
        if (response.status === 404) return "empty";
        return response.ok ? "recovered" : "failed";
      } catch {
        return "failed";
      }
    })();
    attempts.set(cartReference, attempt);
    return attempt;
  };
}
