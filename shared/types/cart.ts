import { Product, ProductVariant } from './product';

export interface CartItem {
  id: string; // unique item entry ID in cart
  productId: string;
  variantId?: string;
  product: Product;
  selectedVariant?: ProductVariant;
  selectedAttributes?: Record<string, string>;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface DiscountCoupon {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  expiresAt: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  appliedCoupon?: DiscountCoupon | null;
  discountAmount: number;
  shippingFee: number;
  estimatedTax: number;
  grandTotal: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
}
