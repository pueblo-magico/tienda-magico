import {
  DEFAULT_COMMERCE_SETTINGS,
  parseCommerceSettings,
  type CommerceSettings,
} from "@/lib/commerce/commerce-settings";
import { cmsFetch } from "./client";

export async function getCommerceSettings(): Promise<CommerceSettings> {
  try {
    const value = await cmsFetch<unknown>({
      path: "/globals/commerce-settings",
      cache: "no-store",
    });
    return parseCommerceSettings(value);
  } catch {
    return DEFAULT_COMMERCE_SETTINGS;
  }
}
