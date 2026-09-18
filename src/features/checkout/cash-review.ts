import { arsPesosToMinorUnits } from "@/lib/money/ars-input";

export function cashReview(
  total: number,
  value: unknown,
): { total: number; received: number; change: number } | null {
  const received = arsPesosToMinorUnits(value);
  if (!Number.isSafeInteger(total) || total <= 0 || received !== total)
    return null;
  return { total, received, change: received - total };
}
