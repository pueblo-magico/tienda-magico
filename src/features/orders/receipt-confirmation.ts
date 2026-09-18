export function receiptConfirmationBody(
  reference: string,
  confirmed: boolean,
): { action: "confirm-receipt"; reference: string } | null {
  return confirmed ? { action: "confirm-receipt", reference } : null;
}
