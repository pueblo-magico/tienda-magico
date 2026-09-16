import { recordPaymentNotification } from "@/lib/commerce";
import { receiveMercadoPagoNotification } from "./providers/mercado-pago/webhook";

export function receivePaymentNotification(
  request: Request,
): Promise<Response> {
  return receiveMercadoPagoNotification(request, recordPaymentNotification);
}
