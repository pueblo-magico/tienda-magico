export const IDENTIFICATION_TYPES = ["DNI", "CUIT", "CUIL"] as const;
export type TransferIdentification = { type: string; number: string };

export function normalizeTransferIdentification(
  value: unknown,
): TransferIdentification | null {
  if (!value || typeof value !== "object") return null;
  const { type, number } = value as Record<string, unknown>;
  if (
    typeof type !== "string" ||
    typeof number !== "string" ||
    number.length > 32
  )
    return null;
  const normalizedType = type.trim().toUpperCase();
  if (
    !IDENTIFICATION_TYPES.some((option) => option === normalizedType) ||
    !/^[\d.\s-]+$/.test(number)
  )
    return null;
  const normalizedNumber = number.replace(/[.\s-]/g, "");
  const valid =
    normalizedType === "DNI"
      ? /^\d{6,9}$/.test(normalizedNumber)
      : /^\d{11}$/.test(normalizedNumber);
  return valid ? { type: normalizedType, number: normalizedNumber } : null;
}
