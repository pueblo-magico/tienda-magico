import type { Product, ProductSummary } from "@/types/commerce";

type PrivatePurchasingKey =
  | "supplier"
  | "supplierSKU"
  | "purchaseCost"
  | "termsOverride"
  | "purchasingNotes";

type AssertNever<Value extends never> = Value;

export type ProductPrivatePurchasingBoundary = AssertNever<
  Extract<keyof Product, PrivatePurchasingKey>
>;

export type ProductSummaryPrivatePurchasingBoundary = AssertNever<
  Extract<keyof ProductSummary, PrivatePurchasingKey>
>;
