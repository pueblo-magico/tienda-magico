import "server-only";
import { cookies } from "next/headers";
import { getCmsConfig } from "@/lib/cms/config";
import type { CustomerAccount } from "@/types/account";

export const ACCOUNT_COOKIE = "magico_customer";
export async function accountRequest(path: string, token?: string, body?: unknown, service = false) {
  const config = getCmsConfig();
  if (!config || (service && !config.apiKey)) throw new Error("unavailable");
  const response = await fetch(`${config.baseUrl}${config.apiPrefix}${path}`, {
    method: body === undefined ? "GET" : "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
    headers: { "Content-Type": "application/json", Origin: new URL(process.env.NEXT_PUBLIC_SITE_URL || config.baseUrl).origin, ...(service ? { Authorization: `${config.apiKeyCollection} API-Key ${config.apiKey}` } : token ? { Authorization: `JWT ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "unauthorized" : "unavailable");
  return response.json() as Promise<Record<string, unknown>>;
}
export async function customerSession(token?: string): Promise<CustomerAccount | null> {
  const credential = token ?? (await cookies()).get(ACCOUNT_COOKIE)?.value;
  if (!credential) return null;
  try {
    const data = await accountRequest("/storefront-customer/session", credential);
    const user = data.customer;
    if (!user || typeof user !== "object" || !("id" in user) || typeof user.id !== "number" || !("email" in user) || typeof user.email !== "string" || !("name" in user) || typeof user.name !== "string") return null;
    return { id: user.id, email: user.email, name: user.name };
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return null;
    throw error;
  }
}
export async function customerReferences(): Promise<string[]> {
  const token = (await cookies()).get(ACCOUNT_COOKIE)?.value;
  if (!token) return [];
  try {
    const data = await accountRequest("/storefront-customer/references", token);
    return Array.isArray(data.references) ? data.references.filter((value): value is string => typeof value === "string" && /^[1-9]\d*::[a-f0-9]{40}$/.test(value)) : [];
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return [];
    throw error;
  }
}
export async function linkCustomerOrders(references: string[], credential?: string) {
  const token = credential ?? (await cookies()).get(ACCOUNT_COOKIE)?.value;
  if (token && references.length) await accountRequest("/storefront-customer/link", token, { references });
}
