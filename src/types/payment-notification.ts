export type PaymentNotification = {
  idempotencyKey: string;
  resourceId: string;
  paymentStatus: string;
  amount: number;
  currency: string;
  publicReference: string | null;
  liveMode: boolean;
  providerUpdatedAt: string;
};
