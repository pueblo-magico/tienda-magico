export function buildWhatsAppUrl(
  phoneNumber: string | undefined,
  message: string,
): string {
  const normalizedNumber = phoneNumber?.replace(/\D/g, "") ?? "";
  const destination = normalizedNumber
    ? `https://wa.me/${normalizedNumber}`
    : "https://wa.me/";

  return `${destination}?text=${encodeURIComponent(message)}`;
}
