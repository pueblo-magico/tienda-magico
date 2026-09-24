import "server-only";
import { cookies } from "next/headers";
import { customerReferences, linkCustomerOrders } from "@/lib/account/server";
import {
  GUEST_ORDERS_COOKIE,
  parseGuestCartReferences,
} from "@/lib/commerce/guest-order-access";

export async function guestCartReferences() {
  const guest = parseGuestCartReferences(
    (await cookies()).get(GUEST_ORDERS_COOKIE)?.value,
  );
  return [...new Set([...guest, ...(await customerReferences())])];
}

export async function rememberGuestCart(reference: string) {
  const existing = parseGuestCartReferences(
    (await cookies()).get(GUEST_ORDERS_COOKIE)?.value,
  );
  const references = parseGuestCartReferences(
    JSON.stringify([
      ...existing.filter((entry) => entry !== reference),
      reference,
    ]),
  );
  if (!references.includes(reference)) return;
  (await cookies()).set(GUEST_ORDERS_COOKIE, JSON.stringify(references), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  await linkCustomerOrders([reference]);
}
