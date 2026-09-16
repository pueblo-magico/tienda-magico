export const GUEST_ORDERS_COOKIE = "magico_guest_orders";
export const MAX_GUEST_CARTS = 20;

export function parseGuestCartReferences(value: string | undefined): string[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return [
      ...new Set(
        parsed.filter(
          (entry): entry is string =>
            typeof entry === "string" && /^[1-9]\d*::[a-f0-9]{40}$/.test(entry),
        ),
      ),
    ].slice(-MAX_GUEST_CARTS);
  } catch {
    return [];
  }
}
