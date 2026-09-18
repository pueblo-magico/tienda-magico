export type PaymentNotification = {
  idempotencyKey: string;
  resourceId: string;
  paymentStatus: string;
  amount: number;
  currency: string;
  publicReference: string | null;
  liveMode: boolean;
  providerUpdatedAt: string;
  payerType?: string | null;
  payerNumber?: string | null;
  paymentType?: string | null;
  statusDetail?: string | null;
  refundedAmount?: number | null;
  approvedAt?: string | null;
};
