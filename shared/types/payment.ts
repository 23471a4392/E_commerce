export type PaymentProvider = 'stripe' | 'paypal' | 'apple_pay' | 'crypto_web3' | 'klarna_bnpl' | 'cash_on_delivery';

export interface PaymentIntent {
  id: string;
  orderId?: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  clientSecret: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled' | 'failed';
  createdAt: string;
  metadata?: Record<string, string>;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  transactionId: string;
  amount: number;
  reason: 'customer_return' | 'defective_product' | 'cancellation' | 'duplicate_charge';
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requestedByUserId: string;
  processedByUserId?: string;
  notes?: string;
  createdAt: string;
  processedAt?: string;
}
