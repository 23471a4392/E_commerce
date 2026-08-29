import { CartItem } from './cart';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentDetails {
  method: 'credit_card' | 'paypal' | 'stripe_mock' | 'cash_on_delivery';
  cardLastFour?: string;
  cardBrand?: string;
  transactionId: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paidAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  variantName?: string;
  attributes?: Record<string, string>;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  paymentDetails: PaymentDetails;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  status: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  estimatedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutPayload {
  items: CartItem[];
  shippingAddress: ShippingAddress;
  shippingMethodId: string;
  couponCode?: string;
  paymentMethod: 'credit_card' | 'paypal' | 'stripe_mock' | 'cash_on_delivery';
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
}
